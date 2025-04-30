const {createLogger, format, transports} = require('winston');

const seclogger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        format.json()
        // creates log info 
    ),
    transports: [
        new transports.File({filename: 'security.log'}),
        // creates log file called security.log in root dir
        new transports.Console()
    ]
});
module.exports = seclogger;
