$(document).ready(() => {
  this.getDrones()
  this.getPackages()

})

const proxyurl = "https://cors-anywhere.herokuapp.com/"; // heroku cors
const dronesEndpoint = "https://codetest.kube.getswift.co/drones" // Endpoint for random drones
const packagesEndpoint = "https://codetest.kube.getswift.co/packages" // Endpoint forrandom packages
const glocEndpoint = "https://maps.googleapis.com/maps/api/distancematrix/json?" //google maps distance matrix api
const warehouseLocation = "303 Collins Street, Melbourne, VIC 3000"

var drones;
var availableDrones;
var packages;
var assignments = [];



function getDrones() {
  $.get(proxyurl + dronesEndpoint, (drones) => {
    //$('#drones').text(JSON.stringify(drones))

    drones.sort((a, b) => {
      return a.packages.length > b.packages.length ? 1 : (a.packages.length < b.packages.length ? -1 : 0);
    })
    this.drones = drones;
    this.getAvailableDrones(drones);
  })
};

// Sort packages by deadline
function getPackages() {
  $.get(proxyurl + packagesEndpoint, (data) => {

    data.sort((a, b) => {
      return a.deadline > b.deadline ? 1 : (a.deadline < b.deadline ? -1 : 0);
    });
    this.packages = data;
  })
};


function getAvailableDrones(dronesArr) {
  this.availableDrones = drones.filter((drone) => {
    return drone.packages.length === 0
  })
  return sortByDistance(availableDrones);
}

function sortByDistance(dronesArr) {
  var url = proxyurl + glocEndpoint;

  // use google distance matrix to calculate distance
  dronesArr.forEach((drone) => {
    $.get(url + `origins=${drone.location.latitude}, ${drone.location.longitude}` + `&destinations=${warehouseLocation}`, (data) => {
      drone.distance = data.rows[0].elements[0].distance.value
    })
  })

  //sort by distance
  dronesArr.sort((a, b) => {
    return a.distance > b.distance ? 1 : (a.distance < b.distance ? -1 : 0);
  });
  console.log(dronesArr)
  this.makeAssignment()
}

function makeAssignment() {
  availableDrones.forEach(function (drone, i) {

    if (drone.packages.length === 0) {
      drone.packages.push(packages.shift())
    }

    assignments.push(new Assignment(drone))
  }, this);

  debugger
}

// Assignment object
function Assignment(drone) {
  this.droneid = drone.droneId;
  this.packageId = drone.packages[0].packageId;
}

//Sort packages by due date, closest due date first
//Sort 

/**
 * Sort the packages by due dates, closest due dates most important
 * sort the drones by availability, first ones without packages, then ones closest
 * place priority packages in empty drones
 * get geolocation of destination to compare distance
 * MAYBE sort for how long it would take to get to certain point( distance from its postion to package location first then back to base)
 */