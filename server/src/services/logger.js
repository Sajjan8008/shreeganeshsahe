import { createLogger, format, transports } from 'winston';

// Import mongodb
import { configDotenv } from 'dotenv';
import 'winston-mongodb';
const connection = configDotenv().parsed.DB ? configDotenv().parsed.DB : configDotenv().parsed.LOCAL;


const logger = createLogger({
    transports: [
        new transports.MongoDB(
            {
                lavel : 'error',
                db:connection,
                options:{ useUnifiedTopology: true },
                collection:'error',
                format: format.combine(format.timestamp(),format.json()),

            }
        )
    ]
});


export default logger;