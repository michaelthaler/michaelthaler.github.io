const STADIA_TILE_BASE =
  "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png";
const TRAVELTIME_API_BASE = "https://api.traveltimeapp.com/v4";
const MODE_LABELS = {
  auto: "Drive",
  bicycle: "Bike",
  pedestrian: "Walk",
  public_transport: "Transit",
};
const MODE_COLORS = {
  auto: "#0d7a6a",
  bicycle: "#2e75b6",
  pedestrian: "#8c5a1e",
  public_transport: "#c04a88",
};

const form = document.querySelector("#travelForm");
const locationInput = document.querySelector("#locationInput");
const locateButton = document.querySelector("#locateButton");
const timeRange = document.querySelector("#timeRange");
const timeOutput = document.querySelector("#timeOutput");
const modeSelect = document.querySelector("#modeSelect");
const departureField = document.querySelector("#departureField");
const departureInput = document.querySelector("#departureInput");
const apiKeyInput = document.querySelector("#apiKeyInput");
const travelTimeAppIdInput = document.querySelector("#travelTimeAppIdInput");
const travelTimeApiKeyInput = document.querySelector("#travelTimeApiKeyInput");
const submitButton = document.querySelector("#submitButton");
const statusCard = document.querySelector(".status-card");
const statusText = document.querySelector("#statusText");
const summaryOrigin = document.querySelector("#summaryOrigin");
const summaryTime = document.querySelector("#summaryTime");
const summaryMode = document.querySelector("#summaryMode");
const summaryDeparture = document.querySelector("#summaryDeparture");

const savedState = loadState();
locationInput.value = savedState.location || "";
timeRange.value = savedState.time || "30";
modeSelect.value = MODE_LABELS[savedState.mode] ? savedState.mode : "auto";
apiKeyInput.value = savedState.apiKey || "";
travelTimeAppIdInput.value = savedState.travelTimeAppId || "";
travelTimeApiKeyInput.value = savedState.travelTimeApiKey || "";
departureInput.value = savedState.departureTime || getDefaultDepartureTime();
timeOutput.textContent = `${timeRange.value} min`;

let activeOrigin = isOrigin(savedState.origin) ? savedState.origin : null;
let tileLayer;
let originMarker;
let isochroneLayer;
let currentIsochroneMode = modeSelect.value;

const map = L.map("map", {
  zoomControl: false,
  minZoom: 2,
}).setView([51.5072, -0.1276], 11);

L.control
  .zoom({
    position: "bottomright",
  })
  .addTo(map);

tileLayer = L.tileLayer(getTileUrl(apiKeyInput.value.trim()), {
  maxZoom: 20,
  attribution:
    '&copy; <a href="https://stadiamaps.com/" target="_blank" rel="noreferrer">Stadia Maps</a>, ' +
    '&copy; <a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">OpenMapTiles</a> ' +
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
}).addTo(map);

isochroneLayer = L.geoJSON(null, {
  style: () => {
    const color = MODE_COLORS[currentIsochroneMode] || MODE_COLORS.auto;
    return {
      color,
      weight: 2,
      fillColor: color,
      fillOpacity: 0.22,
    };
  },
}).addTo(map);

map.on("click", event => {
  const origin = {
    lat: event.latlng.lat,
    lon: event.latlng.lng,
    label: formatCoordinates(event.latlng.lat, event.latlng.lng),
  };

  setOrigin(origin, { centerMap: false });
  setStatus("Origin updated from the map. Press “Show reachable area” to redraw.");
});

timeRange.addEventListener("input", () => {
  timeOutput.textContent = `${timeRange.value} min`;
  summaryTime.textContent = `${timeRange.value} min`;
  persistState();
});

modeSelect.addEventListener("change", () => {
  summaryMode.textContent = MODE_LABELS[modeSelect.value];
  syncModeVisibility();
  syncDepartureSummary();
  persistState();
});

apiKeyInput.addEventListener("change", () => {
  updateTileLayer(apiKeyInput.value.trim());
  persistState();
});

travelTimeAppIdInput.addEventListener("input", persistState);
travelTimeApiKeyInput.addEventListener("input", persistState);
departureInput.addEventListener("input", () => {
  syncDepartureSummary();
  persistState();
});

locationInput.addEventListener("input", () => {
  summaryOrigin.textContent = locationInput.value.trim() || "Not set";
  persistState();
});

locateButton.addEventListener("click", async () => {
  if (!navigator.geolocation) {
    setStatus("This browser does not support geolocation.", true);
    return;
  }

  setLoading(true);
  setStatus("Finding your current location...");

  navigator.geolocation.getCurrentPosition(
    position => {
      const origin = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        label: "Current location",
      };

      setOrigin(origin, { centerMap: true });
      setStatus("Current location captured. Press “Show reachable area” to draw the reachable area.");
      setLoading(false);
    },
    error => {
      const message =
        error.code === error.PERMISSION_DENIED
          ? "Location access was blocked. You can still type an address or click the map."
          : "I couldn't read your current position. Try again or enter a place manually.";
      setStatus(message, true);
      setLoading(false);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
    },
  );
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  await drawReachableArea();
});

if (locationInput.value) {
  summaryOrigin.textContent = locationInput.value;
}
summaryTime.textContent = `${timeRange.value} min`;
summaryMode.textContent = MODE_LABELS[modeSelect.value];
syncModeVisibility();
syncDepartureSummary();

if (activeOrigin) {
  setOrigin(activeOrigin, { centerMap: true });
}

async function drawReachableArea() {
  const query = locationInput.value.trim();
  const apiKey = apiKeyInput.value.trim();
  const mode = modeSelect.value;
  const travelTime = Number(timeRange.value);

  if (!query) {
    setStatus("Add a starting location before drawing the map.", true);
    locationInput.focus();
    return;
  }

  persistState();
  updateTileLayer(apiKey);
  setLoading(true);
  setStatus("Finding your origin...");

  try {
    const origin = await resolveOrigin(query, apiKey);
    setOrigin(origin, { centerMap: true });

    setStatus(`Drawing the ${travelTime}-minute reachable area...`);
    const data =
      mode === "public_transport"
        ? await fetchTravelTimeTransitIsochrone({
            origin,
            travelTime,
          })
        : await fetchIsochrone({
            origin,
            travelTime,
            mode,
            apiKey,
          });

    currentIsochroneMode = mode;
    isochroneLayer.clearLayers();
    isochroneLayer.addData(data);
    const bounds = isochroneLayer.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.15), {
        maxZoom: 13,
      });
    }

    const popupText = `${MODE_LABELS[mode]}: ${travelTime} min`;
    originMarker.bindPopup(`<strong>${escapeHtml(origin.label)}</strong><br>${escapeHtml(popupText)}`);

    setStatus(`Reachable area ready. This shows where you can get within ${travelTime} minutes by ${MODE_LABELS[mode].toLowerCase()}.`);
  } catch (error) {
    console.error(error);
    setStatus(getErrorMessage(error), true);
  } finally {
    setLoading(false);
  }
}

async function resolveOrigin(query, apiKey) {
  if (activeOrigin && query === activeOrigin.label) {
    return activeOrigin;
  }

  const coordinates = parseCoordinates(query);
  if (coordinates) {
    return {
      ...coordinates,
      label: formatCoordinates(coordinates.lat, coordinates.lon),
    };
  }

  return geocodeLocation(query, apiKey);
}

async function geocodeLocation(query, apiKey) {
  const api = new stadiaMapsApi.GeocodingApi(getStadiaConfiguration(apiKey));
  const data = await api.search({
    text: query,
    size: 1,
  });
  const feature = data.features?.[0];

  if (!feature?.geometry?.coordinates) {
    throw new Error("No matching location was found. Try a more specific place name or coordinates.");
  }

  const [lon, lat] = feature.geometry.coordinates;
  return {
    lat,
    lon,
    label: feature.properties?.label || feature.properties?.name || query,
  };
}

async function fetchIsochrone({ origin, travelTime, mode, apiKey }) {
  const requestBody = {
    id: "travel-time",
    locations: [
      {
        lat: origin.lat,
        lon: origin.lon,
      },
    ],
    costing: mode,
    contours: [
      {
        time: travelTime,
        color: "0d7a6a",
      },
    ],
    polygons: true,
  };

  const api = new stadiaMapsApi.RoutingApi(getStadiaConfiguration(apiKey));
  return api.isochrone({
    isochroneRequest: requestBody,
  });
}

async function fetchTravelTimeTransitIsochrone({ origin, travelTime }) {
  const appId = travelTimeAppIdInput.value.trim();
  const apiKey = travelTimeApiKeyInput.value.trim();

  if (!appId || !apiKey) {
    throw new Error("Transit mode needs a TravelTime Application ID and API key in the Authentication panel.");
  }

  const departureTime = departureInput.value
    ? toIsoString(departureInput.value)
    : new Date().toISOString();

  const response = await fetch(`${TRAVELTIME_API_BASE}/time-map`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/geo+json",
      "X-Application-Id": appId,
      "X-Api-Key": apiKey,
    },
    body: JSON.stringify({
      departure_searches: [
        {
          id: "public-transit",
          coords: {
            lat: origin.lat,
            lng: origin.lon,
          },
          transportation: {
            type: "public_transport",
          },
          departure_time: departureTime,
          travel_time: travelTime * 60,
          properties: ["is_only_walking"],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(await readTravelTimeError(response));
  }

  return response.json();
}

function setOrigin(origin, { centerMap }) {
  activeOrigin = origin;
  locationInput.value = origin.label;
  summaryOrigin.textContent = origin.label;

  if (!originMarker) {
    originMarker = L.marker([origin.lat, origin.lon]).addTo(map);
  } else {
    originMarker.setLatLng([origin.lat, origin.lon]);
  }

  originMarker.bindTooltip(origin.label, {
    direction: "top",
    offset: [0, -10],
  });

  if (centerMap) {
    map.flyTo([origin.lat, origin.lon], Math.max(map.getZoom(), 12), {
      duration: 0.8,
    });
  }

  persistState();
}

function getTileUrl(apiKey) {
  if (!apiKey) {
    return STADIA_TILE_BASE;
  }

  return `${STADIA_TILE_BASE}?api_key=${encodeURIComponent(apiKey)}`;
}

function updateTileLayer(apiKey) {
  tileLayer.setUrl(getTileUrl(apiKey));
}

function syncModeVisibility() {
  const isTransitMode = modeSelect.value === "public_transport";
  departureField.hidden = !isTransitMode;
}

function syncDepartureSummary() {
  if (modeSelect.value !== "public_transport") {
    summaryDeparture.textContent = "Now";
    return;
  }

  summaryDeparture.textContent = formatDepartureDisplay(departureInput.value);
}

function getStadiaConfiguration(apiKey) {
  if (!globalThis.stadiaMapsApi?.Configuration) {
    throw new Error("The Stadia Maps SDK did not load. Refresh the page and try again.");
  }

  if (!apiKey) {
    return new stadiaMapsApi.Configuration();
  }

  return new stadiaMapsApi.Configuration({
    apiKey,
  });
}

function parseCoordinates(value) {
  const match = value.match(
    /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/,
  );

  if (!match) {
    return null;
  }

  const lat = Number(match[1]);
  const lon = Number(match[2]);

  if (Number.isNaN(lat) || Number.isNaN(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return null;
  }

  return { lat, lon };
}

function formatCoordinates(lat, lon) {
  return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
}

function setLoading(isLoading) {
  submitButton.disabled = isLoading;
  locateButton.disabled = isLoading;
  statusCard.classList.toggle("is-loading", isLoading);
}

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.style.color = isError ? "#a23b2f" : "";
}

function getErrorMessage(error) {
  const status = error?.response?.status;

  if (status === 401 || status === 403) {
    return "Stadia rejected the request. On localhost this should usually work, but if routing is blocked in your environment, add a Stadia API key in the Authentication panel.";
  }

  if (status === 429) {
    return "Stadia rate-limited the request. Wait a moment and try again.";
  }

  const sdkMessage =
    error?.body?.error ||
    error?.body?.message ||
    error?.message ||
    error?.response?.statusText;

  if (sdkMessage) {
    return sdkMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong while drawing the reachable area.";
}

async function readTravelTimeError(response) {
  let data;

  try {
    data = await response.json();
  } catch (_error) {
    return "TravelTime request failed.";
  }

  return (
    data.description ||
    data.error?.message ||
    data.error ||
    "TravelTime request failed."
  );
}

function loadState() {
  try {
    return JSON.parse(localStorage.getItem("travel-map-state")) || {};
  } catch (_error) {
    return {};
  }
}

function persistState() {
  const nextState = {
    location: locationInput.value.trim(),
    time: timeRange.value,
    mode: modeSelect.value,
    apiKey: apiKeyInput.value.trim(),
    travelTimeAppId: travelTimeAppIdInput.value.trim(),
    travelTimeApiKey: travelTimeApiKeyInput.value.trim(),
    departureTime: departureInput.value,
    origin:
      activeOrigin && locationInput.value.trim() === activeOrigin.label
        ? activeOrigin
        : null,
  };

  try {
    localStorage.setItem("travel-map-state", JSON.stringify(nextState));
  } catch (_error) {
    // Ignore storage failures so the map still works in stricter browser modes.
  }
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function isOrigin(value) {
  return (
    value &&
    typeof value.label === "string" &&
    typeof value.lat === "number" &&
    Number.isFinite(value.lat) &&
    typeof value.lon === "number" &&
    Number.isFinite(value.lon)
  );
}

function getDefaultDepartureTime() {
  const now = new Date();
  now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0);
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  const hours = `${now.getHours()}`.padStart(2, "0");
  const minutes = `${now.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toIsoString(localValue) {
  return new Date(localValue).toISOString();
}

function formatDepartureDisplay(localValue) {
  if (!localValue) {
    return "Select time";
  }

  const date = new Date(localValue);
  if (Number.isNaN(date.getTime())) {
    return "Select time";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
