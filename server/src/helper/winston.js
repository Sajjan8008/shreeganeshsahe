import  *  as  winston  from  'winston.js';
import  'winston-daily-rotate-file.js';


const transport = new winston.transports.DailyRotateFile({
  filename: './log/%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d'
});

transport.on('rotate', function(oldFilename, newFilename) {
  // do something fun
});

const logger = winston.createLogger({
  transports: [
    transport
  ]
});

logger.stream = {
  write: (req, message) => {
    logger.info(req, message);
  },
};

module.exports = logger;