import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
        this.appAddress = config.appAddress
    }

    initialize(callback) {
        this.web3.eth.getAccounts((error, accts) => {
            console.log(accts);
            this.owner = accts[0];
            let counter = 1;
            
            while(this.airlines.length < 5) {
                this.airlines.push(accts[counter++]);
            }

            while(this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }
            let result = this.flightSuretyData.methods.authorizeCaller(this.appAddress).send({from: this.owner});
            console.log(result);
            callback();
        });
    }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }
    registerAirline(address, name, callback){
        let self = this;
        let payload = {
            airlineName : name,
            airlineAddress : address
        }
        self.flightSuretyApp.methods
            .registerAirline(payload.airlineAddress, payload.airlineName)
            .send({from: self.owner, gas: 5000000,
                gasPrice: 20000000}, (error, result) =>{
                callback(error, payload)
            
            });

    }

   fundAirline(address, callback){
        let funding_value = this.web3.utils.toWei("10", "ether"); //adding some value for front end so no real metamask connection is needed
        let self = this;
        let payload = {
            airlineAddress : address
        }
        console.log(payload);
        self.flightSuretyApp.methods
            .fundAirline(payload.airlineAddress)
            .send({from: self.owner, value: funding_value, gas: 5000000,
                gasPrice: 20000000}, (error, result) =>{
                callback(error, payload)
            
            });

    }

    fetchFlightStatus(flight, callback) {
        let self = this;
        let payload = {
            airline: self.airlines[0],
            flight: flight,
            timestamp: Math.floor(Date.now() / 1000)
        } 
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner}, (error, result) => {
                callback(error, payload);
            });
    }
}