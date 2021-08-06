/* eslint-disable */
const { exec } = require('child_process');
const { copyFile } = require('fs');
require('./paths-register.js');

copyFile('./template.json', '../dist/package.json', (err) => {
    if (err !== null) {
        console.error(err);
        process.exit(1);
    }

    copyFile('../.env', '../dist/.env', (err) => {
        if (err !== null) {
            console.error(err);
            process.exit(1);
        }
        try {
            process.chdir('../dist');

            const p = exec('yarn start');
            p.stdout.pipe(process.stdout, { end: false });
            p.stderr.pipe(process.stderr, { end: false });

            p.on('exit', (code) => console.log('child process exitted with code ' + code));
        } catch (e) {
            console.error(e);
            process.exit(1);
        }
    });
});
