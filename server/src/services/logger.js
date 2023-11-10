import 'dotenv';
import {
    createLogger,
    transports,
    format
}  from 'winston';
import 'winston-mongodb';

let dbConnection = process.env.MONGO_URI_PROD;
const logger = createLogger({
    transports: [
        new transports.MongoDB({
            level: 'info',
            db: dbConnection,
            options: {
                useUnifiedTopology: true
            },
            collection: 'info',
            format: format.combine(format.timestamp(), format.json())
        }),
        new transports.MongoDB({
            level: 'error',
            db: dbConnection,
            options: {
                useUnifiedTopology: true
            },
            collection: 'error',
            format: format.combine(format.timestamp(), format.json())
        })
    ]
})

module.exports = logger;