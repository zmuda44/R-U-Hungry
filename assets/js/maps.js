//Constant locations

const restaurantLocation = [-74.444122, 40.495949]
const southwestGB = [-76.612190, 39.290386]
const northeastGB = [-71.058884, 60]


//Define HTML elements
const directionsSubmitBtn = document.getElementById("directions-submit-btn");
const streetInputEl = document.getElementById("street");
const cityInputEl = document.getElementById("city");
const stateInputEl = document.getElementById("state");
const directionsContainer = document.getElementById("directions-container")
const RULocation = document.getElementById("RU-location")
const inputEl = document.getElementById("input-div")
const outputLocation = document.getElementById("output-location")


//On click of submit, information will be gathered from input fields
directionsSubmitBtn.addEventListener("click", function (e) {
  e.preventDefault();
  
  //Define address
  let address = {
  street: streetInputEl.value.replace(/\s+/g, '+'),
  city: cityInputEl.value.replace(/\s+/g, '+'),
  state: stateInputEl.value.replace(/\s+/g, '+'),
  } 
  
  //Run function getGeoCode with the address object passed as parameter
  getGeoCode(address)

  //Show instructions on screen
  instructions.classList.add("is-active")
})

//Get lon and lat (needs to be lon first) from geocode.maps
function getGeoCode (address) {  
  fetch(`https://geocode.maps.co/search?street=${address.street}&city=${address.city}&state=${address.state}&api_key=6618462d030c4415664524agrd0b0bd`)
  .then(function (response) {    
  return response.json()   
  })
  .then(function (data) {
    if(data.length == 0) {
      alert("Please enter a valid address")
      showYourLocation(data)
    }
    else {
      let geoCode = [data[0].lon, data[0].lat]  
      searchMapBox(geoCode) 
      //Displays what address you entered below input fields
      showYourLocation(geoCode)      
    }

     //Clear Inputs. Need value available for showYourLocation(). Multiple fetch requests not allowed with free api  
    streetInputEl.value = '';
    cityInputEl.value = '';
    stateInputEl.value = '';
  })
}

function searchMapBox (geoCode) {

//Show instructions on screen

mapboxgl.accessToken = 'pk.eyJ1Ijoiem11ZGE0NCIsImEiOiJjbHY0aDF4cnUwOHFrMmlyNHdqZnU3dzM1In0.F3Mg1gD7ilJqRBB0qNki6w';
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: restaurantLocation, // starting position
  zoom: 12
});

// set the bounds of the map
const bounds = [southwestGB, northeastGB];
map.setMaxBounds(bounds);

const start = geoCode || restaurantLocation

async function getRoute(end) {
   
  const query = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`,
      { method: 'GET' }
    );
    if(query.status !== 200) {
      console.log(query.status)}
    const json = await query.json();
    const data = json.routes[0];
    const route = data.geometry.coordinates;
    const geojson = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: route
      }
    };
    // if the route already exists on the map, we'll reset it using setData
    if (map.getSource('route')) {
      map.getSource('route').setData(geojson);
    }
    // otherwise, we'll make a new request
    else {
      map.addLayer({
        id: 'route',
        type: 'line',
        source: {
          type: 'geojson',
          data: geojson
        },
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3887be',
          'line-width': 5,
          'line-opacity': 0.75
        }
      });
    }
   
// get the sidebar and add the instructions
const instructions = document.getElementById('instructions');
const steps = data.legs[0].steps;

let tripInstructions = '';
for (const step of steps) {
  tripInstructions += `<li>${step.maneuver.instruction}</li>`;
}

//Get default value and convert to hours and minutes
const tripMinutes = data.duration / 60
const tripHours = Math.floor(tripMinutes / 60)
const remainingMinutes = Math.floor(tripMinutes % 60)

if (tripHours == 1) {
  instructions.innerHTML = `<p>Trip duration: ${tripHours} hour ${remainingMinutes} Minutes
 </p><ol>${tripInstructions}</ol>`;
}

else if (tripHours < 1) {
  instructions.innerHTML = `<p>Trip duration: ${remainingMinutes} Minutes
  </p><ol>${tripInstructions}</ol>`;
}

else {
  instructions.innerHTML = `<p>Trip duration: ${tripHours} hours ${remainingMinutes} Minutes
 </p><ol>${tripInstructions}</ol>`;
}

instructions.innerHTML = `<p>Trip duration: ${tripHours} ${textHours} ${remainingMinutes} Minutes
 </p><ol>${tripInstructions}</ol>`;

} //end async function
  
map.on('load', () => {
    // make an initial directions request that
    // starts and ends at the same location
    // getRoute(start);
    getRoute(restaurantLocation);
  
    // Add starting point to the map
    map.addLayer({
      id: 'point',
      type: 'circle',
      source: {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Point',
                coordinates: start
              }
            }
          ]
        }
      },
      paint: {
        'circle-radius': 10,
        'circle-color': '#3887be'
      }
    });   
  });

} //end searchMapBox()


//Show what you've entered below input fields.
function showYourLocation (data) {  
  if(data.length == 0) {
    outputLocation.textContent = ``
  }

  else{
    outputLocation.textContent = `You've entered: ${streetInputEl.value}, ${cityInputEl.value}, ${stateInputEl.value}`
  }
}

//Run directions on page load based on previous directions that you gave it from previous session
searchMapBox()

 
