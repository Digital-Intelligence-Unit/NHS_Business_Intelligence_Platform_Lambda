const DiuLibrary = require("diu-data-functions");
const AccessLogStatisticModel = new DiuLibrary.Models.AccessLogStatistic();

class AccessLoggedHandler {
    handle(event, context, callback) {
        // Store list of stats
        let accessLogs = {}; let statistics = [];

        // Loop records
        event.Records.forEach((record) => {
            const date = record.dynamodb.NewImage.date["S"];
            accessLogs[date] = accessLogs[date] || [];
            accessLogs[date].push({
                date: record.dynamodb.NewImage.date["S"],
                type: record.dynamodb.NewImage.type["S"]
            });
        });

        // Get existing stats
        AccessLogStatisticModel.getByDates({ dates: Object.keys(accessLogs) }, (err, data) => {
            // Handle error
            if (err) { console.log(err); return; }

            // Re-map data
            const existingStats = data.reduce((stats, stat) => {
                stats[stat.date + stat.type] = stats;
                return stats;
            }, {});

            // Create rows
            Object.keys(accessLogs).forEach((date) => {
                // Add date total
                statistics.push({
                    type: "Total",
                    date,
                    total: existingStats[date + "Total"] ? (existingStats[date + "Total"].total + accessLogs[date].length) : accessLogs[date].length,
                });

                // Add stat per type
                const types = [...new Set(accessLogs[date].map((item) => item.type))];
                types.forEach((type) => {
                    const logTotal = accessLogs[date].filter((log) => log.type === type).length;
                    statistics.push({
                        type,
                        date,
                        total: existingStats[date + type] ? (existingStats[date + type].total + logTotal) : logTotal,
                    });
                });
            });

            // Persist in database
            if (statistics.length > 0) {
                AccessLogStatisticModel.updateOrCreate(statistics, (err, data) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("Statistics logged to the database");
                    }
                });
            }
        });
    }
}

module.exports = AccessLoggedHandler;
