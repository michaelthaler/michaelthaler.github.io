// In-person presentations and discussant appearances listed on Michael Thaler's CV.
// Virtual events are intentionally omitted. Coordinates use the host city or campus.
var talkLocations = [
  // 2026
  { year: 2026, venue: "ASSA Annual Meeting", location: "Philadelphia, PA, USA", lat: 39.9526, lng: -75.1652 },
  { year: 2026, venue: "LISER Social BEE Workshop", location: "Esch-sur-Alzette, Luxembourg", lat: 49.5009, lng: 5.9803 },
  { year: 2026, venue: "University of Konstanz", location: "Konstanz, Germany", lat: 47.6779, lng: 9.1732 },
  { year: 2026, venue: "Florence Workshop on Behavioral Economics", location: "Florence, Italy", lat: 43.7696, lng: 11.2558 },
  { year: 2026, venue: "University of Amsterdam", location: "Amsterdam, Netherlands", lat: 52.3676, lng: 4.9041 },
  { year: 2026, venue: "Tilburg University", location: "Tilburg, Netherlands", lat: 51.5555, lng: 5.0913 },
  { year: 2026, venue: "University of Kent", location: "Canterbury, UK", lat: 51.2802, lng: 1.0789 },
  { year: 2026, venue: "Zurich Psychology and Economics Workshop", location: "Zurich, Switzerland", lat: 47.3769, lng: 8.5417 },
  { year: 2026, venue: "CREST", location: "Palaiseau, France", lat: 48.7145, lng: 2.2457 },
  { year: 2026, venue: "Behavioral Decision Research in Management", location: "New York, NY, USA", lat: 40.7128, lng: -74.006 },
  { year: 2026, venue: "CEPR Workshop on Media, Technology, Politics, and Society", location: "Rome, Italy", lat: 41.9028, lng: 12.4964 },
  { year: 2026, venue: "Early-Career Behavioral Economics Conference", location: "Chicago, IL, USA", lat: 41.8781, lng: -87.6298 },
  { year: 2026, venue: "ESA Europe", location: "Barcelona, Spain", lat: 41.3874, lng: 2.1686 },

  // 2025
  { year: 2025, venue: "University of British Columbia", location: "Vancouver, BC, Canada", lat: 49.2827, lng: -123.1207 },
  { year: 2025, venue: "University of Southern California", location: "Los Angeles, CA, USA", lat: 34.0522, lng: -118.2437 },
  { year: 2025, venue: "Brown University", location: "Providence, RI, USA", lat: 41.824, lng: -71.4128 },
  { year: 2025, venue: "Bocconi University", location: "Milan, Italy", lat: 45.4642, lng: 9.19 },
  { year: 2025, venue: "University of Milan", location: "Milan, Italy", lat: 45.4642, lng: 9.19 },
  { year: 2025, venue: "Sciences Po", location: "Paris, France", lat: 48.8566, lng: 2.3522 },
  { year: 2025, venue: "Paris 1 / Paris School of Economics", location: "Paris, France", lat: 48.8566, lng: 2.3522 },
  { year: 2025, venue: "FAIR at NHH", location: "Bergen, Norway", lat: 60.3913, lng: 5.3221 },
  { year: 2025, venue: "Pompeu Fabra University", location: "Barcelona, Spain", lat: 41.3874, lng: 2.1686 },
  { year: 2025, venue: "University of Warwick", location: "Coventry, UK", lat: 52.4068, lng: -1.5197 },
  { year: 2025, venue: "CEPR Political Economy Symposium", location: "Rome, Italy", lat: 41.9028, lng: 12.4964 },
  { year: 2025, venue: "Paris Bounded Rationality Workshop", location: "Paris, France", lat: 48.8566, lng: 2.3522 },
  { year: 2025, venue: "Bonn/IZA Beliefs Workshop", location: "Bonn, Germany", lat: 50.7374, lng: 7.0982 },
  { year: 2025, venue: "Warwick Strategic Information Workshop", location: "Coventry, UK", lat: 52.4068, lng: -1.5197 },
  { year: 2025, venue: "University of Vienna Behavioral Public Workshop", location: "Vienna, Austria", lat: 48.2082, lng: 16.3738 },
  { year: 2025, venue: "CESifo Area Conference on Behavioral Economics", location: "Munich, Germany", lat: 48.1351, lng: 11.582 },
  { year: 2025, role: "Discussant", venue: "ASSA Annual Meeting", location: "San Francisco, CA, USA", lat: 37.7749, lng: -122.4194 },
  { year: 2025, role: "Discussant", venue: "Cognitive Foundations in Finance Conference", location: "London, UK", lat: 51.5074, lng: -0.1278 },
  { year: 2025, role: "Discussant", venue: "Benelux PECO", location: "Rotterdam, Netherlands", lat: 51.9244, lng: 4.4777 },

  // 2024
  { year: 2024, venue: "University of Bonn", location: "Bonn, Germany", lat: 50.7374, lng: 7.0982 },
  { year: 2024, venue: "University of Bristol", location: "Bristol, UK", lat: 51.4545, lng: -2.5879 },
  { year: 2024, venue: "Berlin Behavioral Economics", location: "Berlin, Germany", lat: 52.52, lng: 13.405 },
  { year: 2024, venue: "Middlebury College", location: "Middlebury, VT, USA", lat: 44.0153, lng: -73.1673 },
  { year: 2024, venue: "Economics of Media Bias Workshop", location: "Cologne, Germany", lat: 50.9375, lng: 6.9603 },
  { year: 2024, venue: "London Behavioural Finance Group", location: "London, UK", lat: 51.5074, lng: -0.1278 },
  { year: 2024, venue: "Belief, Identity, and Motivated Reasoning Workshop", location: "London, UK", lat: 51.5074, lng: -0.1278 },
  { year: 2024, venue: "Advances with Field Experiments", location: "London, UK", lat: 51.5074, lng: -0.1278 },
  { year: 2024, venue: "SITE: Experimental Economics", location: "Stanford, CA, USA", lat: 37.4275, lng: -122.1697 },

  // 2023
  { year: 2023, venue: "LMU Munich", location: "Munich, Germany", lat: 48.1351, lng: 11.582 },
  { year: 2023, venue: "Lund University", location: "Lund, Sweden", lat: 55.7047, lng: 13.191 },
  { year: 2023, venue: "Stockholm University", location: "Stockholm, Sweden", lat: 59.3293, lng: 18.0686 },
  { year: 2023, venue: "King's College London", location: "London, UK", lat: 51.5074, lng: -0.1278 },
  { year: 2023, venue: "ASSA Annual Meeting", location: "New Orleans, LA, USA", lat: 29.9511, lng: -90.0715 },
  { year: 2023, venue: "Behavioral Economics Annual Meeting", location: "New Haven, CT, USA", lat: 41.3083, lng: -72.9279 },
  { year: 2023, venue: "Maastricht M-BEES", location: "Maastricht, Netherlands", lat: 50.8514, lng: 5.691 },
  { year: 2023, venue: "ESA Europe", location: "Exeter, UK", lat: 50.7184, lng: -3.5339 },
  { year: 2023, venue: "Workshop on Beliefs, Narratives, and Memory", location: "Herrsching, Germany", lat: 47.9989, lng: 11.1761 },
  { year: 2023, role: "Discussant", venue: "SSRC Workshop on the Economics of Social Media", location: "New York, NY, USA", lat: 40.7128, lng: -74.006 },

  // 2022 — virtual events omitted
  { year: 2022, venue: "University College London", location: "London, UK", lat: 51.5074, lng: -0.1278 },
  { year: 2022, venue: "University of Toronto", location: "Toronto, ON, Canada", lat: 43.6532, lng: -79.3832 },
  { year: 2022, venue: "University of Warwick", location: "Coventry, UK", lat: 52.4068, lng: -1.5197 },
  { year: 2022, venue: "HEC Paris", location: "Jouy-en-Josas, France", lat: 48.7591, lng: 2.1691 },
  { year: 2022, venue: "University of Exeter", location: "Exeter, UK", lat: 50.7184, lng: -3.5339 },
  { year: 2022, venue: "University of Nottingham", location: "Nottingham, UK", lat: 52.9548, lng: -1.1581 },
  { year: 2022, venue: "Imperial College London", location: "London, UK", lat: 51.5074, lng: -0.1278 },
  { year: 2022, venue: "NBER Summer Institute: Political Economy", location: "Cambridge, MA, USA", lat: 42.3736, lng: -71.1097 },
  { year: 2022, venue: "SITE: Psychology and Economics", location: "Stanford, CA, USA", lat: 37.4275, lng: -122.1697 },
  { year: 2022, venue: "Advances with Field Experiments", location: "Chicago, IL, USA", lat: 41.8781, lng: -87.6298 },
  { year: 2022, venue: "ESA Europe", location: "Bologna, Italy", lat: 44.4949, lng: 11.3426 },

  // 2021 — virtual events omitted
  { year: 2021, venue: "UC Berkeley Haas", location: "Berkeley, CA, USA", lat: 37.8715, lng: -122.273 },
  { year: 2021, venue: "University of Michigan", location: "Ann Arbor, MI, USA", lat: 42.2808, lng: -83.743 },
  { year: 2021, venue: "Purdue University", location: "West Lafayette, IN, USA", lat: 40.4259, lng: -86.9081 },
  { year: 2021, venue: "Princeton University", location: "Princeton, NJ, USA", lat: 40.3573, lng: -74.6672 },
  { year: 2021, venue: "University of Nottingham", location: "Nottingham, UK", lat: 52.9548, lng: -1.1581 },
  { year: 2021, venue: "University of Amsterdam Belief-Based Utility Workshop", location: "Amsterdam, Netherlands", lat: 52.3676, lng: 4.9041 },
  { year: 2021, venue: "Maastricht M-BEES", location: "Maastricht, Netherlands", lat: 50.8514, lng: 5.691 },

  // 2020 — virtual events omitted
  { year: 2020, venue: "Stanford University", location: "Stanford, CA, USA", lat: 37.4275, lng: -122.1697 },
  { year: 2020, venue: "Carnegie Mellon University", location: "Pittsburgh, PA, USA", lat: 40.4406, lng: -79.9959 },
  { year: 2020, venue: "Sciences Po", location: "Paris, France", lat: 48.8566, lng: 2.3522 },
  { year: 2020, venue: "Paris School of Economics", location: "Paris, France", lat: 48.8566, lng: 2.3522 },
  { year: 2020, venue: "Harvard University", location: "Cambridge, MA, USA", lat: 42.3736, lng: -71.1097 },
  { year: 2020, venue: "Princeton University", location: "Princeton, NJ, USA", lat: 40.3573, lng: -74.6672 },

  // 2019
  { year: 2019, venue: "Harvard University", location: "Cambridge, MA, USA", lat: 42.3736, lng: -71.1097 },
  { year: 2019, venue: "Microsoft Research New England", location: "Cambridge, MA, USA", lat: 42.3736, lng: -71.1097 },
  { year: 2019, venue: "SITE: Psychology and Economics", location: "Stanford, CA, USA", lat: 37.4275, lng: -122.1697 },
  { year: 2019, venue: "Early-Career Behavioral Economics Conference", location: "San Diego, CA, USA", lat: 32.7157, lng: -117.1611 },
  { year: 2019, venue: "ESA North America", location: "Los Angeles, CA, USA", lat: 34.0522, lng: -118.2437 },
  { year: 2019, venue: "MIT Human Cooperation Lab", location: "Cambridge, MA, USA", lat: 42.3736, lng: -71.1097 },
  { year: 2019, venue: "MIT Media Lab", location: "Cambridge, MA, USA", lat: 42.3736, lng: -71.1097 }
];
