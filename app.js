
$(() => {
  $.when(getWarehouseCoords(), getDrones(), getPackages()).done((a, b, c) => {
    const drones = b[0];
    const availableDrones = getAvailableDrones(b[0]);
    const packages = c[0];
    
    makeAssignment(availableDrones, packages);
  })
});

const proxyurl = "https://cors-anywhere.herokuapp.com/"; // heroku cors endpoint to avoid CORS error
const dronesEndpoint = "https://codetest.kube.getswift.co/drones"; // Endpoint for random drones
const packagesEndpoint = "https://codetest.kube.getswift.co/packages"; // Endpoint for random packages
const gcordsEndpoint = "https://maps.googleapis.com/maps/api/geocode/json?"; //google maps geocoding endpoint
const warehouseAddress = "303 Collins Street, Melbourne, VIC 3000";
var wareCords;

var assignments = [];
var unassigned = [];
var results = {};


function getWarehouseCoords() {
  return $.get(proxyurl + gcordsEndpoint + `address=${warehouseAddress}`, (data) => {
      wareCords = data.results[0].geometry.location;
    }).done(() => console.log('finished getting cords'))
    .fail(() => console.log('Failed coords request'))
}

function getDrones() {
  return $.get(proxyurl + dronesEndpoint, (drones) => {
      drones.sort((a, b) => {
        return a.packages.length > b.packages.length ? 1 : (a.packages.length < b.packages.length ? -1 : 0);
      })
    }).done(() => console.log("Finish getting drones"))
    .fail(() => console.log("Failed drone request"))
};

// get all packages and sort by deadline
function getPackages() {
  return $.get(proxyurl + packagesEndpoint, (data) => {
      data.sort((a, b) => {
        return a.deadline > b.deadline ? 1 : (a.deadline < b.deadline ? -1 : 0);
      });
    }).done(() => console.log("Finished getting packages"))
    .fail(() => console.log("Failed package request"))
};


function getAvailableDrones(dronesArr) {
  this.availableDrones = dronesArr.filter((drone) => {
    return drone.packages.length === 0;
  })
 return this.sortByDistance(availableDrones);
}

function sortByDistance(dronesArr) {

  // Calculate distance from warehouse
  dronesArr.forEach((drone) => {
    drone.distance = calculateDistance(drone.location.latitude, drone.location.longitude)
  });

  // sort by distance
 return dronesArr.sort((a, b) => {
    return a.distance > b.distance ? 1 : (a.distance < b.distance ? -1 : 0);
  });
};

function makeAssignment(dronesArr, packagesArr) {
  if (dronesArr && dronesArr.length !== 0) {

    dronesArr.forEach((drone) => {

      if (drone.packages.length === 0 && packagesArr.length > 0) {
        drone.packages.push(packagesArr.shift())
        assignments.push(new Assignment(drone))
      }

    })

    if (packagesArr.length > 0) {
      packagesArr.forEach((package) => {
        unassigned.push(package.packageId)
      })
    }
  }

  results.assignments = assignments;
  results.unassignedPackageIds = unassigned;
  document.body.innerHTML = JSON.stringify(results);
}

// Haversine distance formula
function calculateDistance(lat1, lon1, lat2 = wareCords.lat, lon2 = wareCords.lng) {
  var radlat1 = Math.PI * lat1 / 180
  var radlat2 = Math.PI * lat2 / 180
  var theta = lon1 - lon2
  var radtheta = Math.PI * theta / 180
  var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
  dist = Math.acos(dist)
  dist = dist * 180 / Math.PI
  dist = dist * 60 * 1.1515

  // convert to kilometers
  dist = dist * 1.609344;
  return dist;
}

// Assignment class
function Assignment(drone) {
  this.droneId = drone.droneId;
  this.packageId = drone.packages[0].packageId;
}



/**
 * Sort the packages by due dates, closest due dates most important
 * sort the drones by availability, first ones without packages, then ones closest
 * place priority packages in empty drones
 * get geolocation of destination to compare distance
 * MAYBE sort for how long it would take to get to certain point( distance from its postion to package location first then back to base)
 */