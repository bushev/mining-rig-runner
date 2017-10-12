'use strict';

const spawn   = require('child_process').spawn;
const exec    = require('child_process').exec;
const winston = require('winston');
const request = require('request');
const async   = require('async');
const _       = require('lodash');
const merge   = require('merge');

const CLAYMORE_PATH = `/home/min/mining-rig/bin/claymore_9_7/ethdcrminer64`;

class MinerRig {

    constructor() {

        this.logger = new (winston.Logger)({
            transports: [
                new (winston.transports.Console)(),
                new (winston.transports.File)({
                    json: false,
                    maxsize: 1024 * 1024 * 1024 * 10,
                    maxFiles: 10,
                    filename: '/home/min/mining-rig/rig.log'
                })
            ]
        });

        /**
         *
         * @type {string}
         */
        this.controllerIPAddress = '192.168.1.139';

        /**
         *
         * @type {null}
         */
        this.claymoreProcess = null;

        /**
         *
         * @type {number}
         */
        this.reportIntervalInSec = 30;

        /**
         *
         * @type {number}
         */
        this.claymoreStartDelayInSec = 30;

        /**
         *
         * @type {number}
         */
        this.fansSpeed = 100;
    }

    /**
     * Initiate rig
     *
     * @param callback
     */
    init(callback) {

        request.get({
            url: `http://${this.controllerIPAddress}:8080/api/v1/rigs/init`,
            json: true
        }, (err, res, body) => {
            if (err) return this.logger.info(err);
            if (res.statusCode !== 200) this.logger.info(`MinerRig::init: status code is ${res.statusCode}`);

            this.logger.info(body);

            this.name       = body.name;
            this.ethAddress = body.ethAddress;

            this.logger.info('Init done');

            callback();
        });
    }

    runClaymore() {

        this.logger.info('Starting claymoreProcess..');

        this.claymoreProcess = spawn(CLAYMORE_PATH, [
            '-epool', 'eu1.ethermine.org:4444',
            '-ewal', this.ethAddress + '.' + this.name.replace('-', ''),
            '-wd', '0',
            '-epsw', 'x',
            '-r', '-1', // disable automatic restarting
            '-dcri', '0',
            '-logfile', '/home/min/mining-rig/claymore.log'
        ], {
            env: {
                GPU_USE_SYNC_OBJECTS: 1,
                GPU_MAX_ALLOC_PERCENT: 100
            }
        });

        this.claymoreProcess.stdout.on('data', data => {

            data = data.toString();

            this.logger.info(`stdout:`);
            this.logger.info(data);

            if (data.indexOf('hangs in OpenCL call') > -1) {

                this.logger.info('GPU hangs in OpenCL call, exiting..');
                process.exit(1);
            }

            if (data.indexOf('Total Speed') > -1 && data.indexOf('fan') > -1 && data.indexOf('ETH:') > -1) {

                const gpu = [];

                const gpuSpeedData = _.uniqBy(data.match(/GPU\d\s\d+\.\d+\sMh\/s/g).map(item => {
                    return {
                        name: item.split(' ')[0],
                        speed: item.split(' ')[1]
                    }
                }), 'name');

                const gpuTempData = _.uniqBy(data.match(/GPU\d\st=\d+C\sfan=\d+%/g).map(item => {
                    return {
                        name: item.split(' ')[0],
                        temperature: item.split(' ')[1].split('=')[1].slice(0, -1),
                        fanSpeed: item.split(' ')[2].split('=')[1].slice(0, -1)
                    }
                }), 'name');

                for (let i = 0; i < gpuSpeedData.length; i++) {

                    let gpuSpeedDataItem = gpuSpeedData[i];
                    let gpuTempDataItem  = _.find(gpuTempData, {name: gpuSpeedDataItem.name});

                    gpu.push(merge(gpuSpeedDataItem, gpuTempDataItem));
                }

                const status = {
                    totalSpeed: data.match(/(\d+\.\d+) Mh\/s/)[1],
                    gpu: gpu
                };

                this.logger.info(status);

                request.put({
                    url: `http://${this.controllerIPAddress}:8080/api/v1/rigs/${this.name}/status`,
                    form: status,
                    json: true
                }, (err, res, body) => {
                    if (err) return this.logger.info(err);
                    if (res.statusCode !== 201) return this.logger.info(`POST: rig-status is ${res.statusCode}`);

                    this.logger.info(body);

                    if (this.fansSpeed !== body.fansSpeed) {

                        this.fansSpeed = body.fansSpeed;

                        this.setFansSpeed(this.fansSpeed, (err) => {
                            if (err) this.logger.error(err);
                        });
                    }

                    this.logger.info(status);
                });
            }
        });

        this.claymoreProcess.stderr.on('data', data => {
            this.logger.info(`stderr:`);
            this.logger.info(data.toString());
        });

        this.claymoreProcess.on('close', code => {
            this.logger.info(`claymore process exited with code ${code}`);
        });

        this.claymoreProcess.stdin.setEncoding('utf-8');

        setInterval(() => { // request status report
            this.logger.info(`request status report..`);
            this.claymoreProcess.stdin.write('s');
        }, this.reportIntervalInSec * 1000);
    }

    /**
     * Set GPU fans speed
     *
     * @param speed
     * @param callback
     */
    setFansSpeed(speed, callback) {

        exec(`sudo /home/min/mining-rig/set-fans-speed.sh -s ${speed}`, (err, stdout, stderr) => {
            if (err) {
                this.logger.error(`Unable to set fans speed to ${speed}, error: ${err}`);
                return callback(err);
            }

            if (stderr) {
                this.logger.error(`Unable to set fans speed to ${speed}, stderr: ${stderr}`);
                return callback(new Error(stderr));
            }

            this.logger.info(`Rig: ${this.name}, ${stdout}`);

            callback();
        });
    }

    bootstrap() {

        this.logger.info(`Sleeping 30 sec before start miner..`);

        setTimeout(() => {

            async.series([callback => {

                this.init(callback);

            }, callback => {

                this.setFansSpeed(this.fansSpeed, callback);

            }, callback => { // callback will be newer called

                this.logger.info(`Starting claymore..`);
                this.runClaymore();

            }], err => {
                if (err) return this.logger.error(err);
            });

        }, this.claymoreStartDelayInSec * 1000);
    }
}

let minerRig = new MinerRig();

minerRig.bootstrap();

// sudo /usr/bin/node /home/min/mining-rig/rig.js