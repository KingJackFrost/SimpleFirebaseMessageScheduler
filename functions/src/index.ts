const functions = require('firebase-functions');
const secureCompare = require('secure-compare');
import * as admin from 'firebase-admin';

admin.initializeApp();
const thirtyminutes = 1800;
const hourstoseconds = 60 * 60;
const minutestoseconds = 60;
const db = admin.database();
const currentUsersRef = db.ref('/CurrentUsers');

//Cron key is 2a0771369b354abe3dacd0a3049b5342cd382773 (using mine atm)
exports.LazyScheduler = functions.https.onRequest((req, res) => {
    let flag = 0; //Check if we sent a message
    const key = req.query.key;
    // Exit if the keys don't match.
    if (!secureCompare(key, functions.config().cron.key)) {
        console.log('The key provided in the request does not match the key set in the environment. Check that ', key,
            ' matches the cron.key attribute in `firebase env:get`');
        res.status(403).send('Security key does not match. Make sure your "key" URL query parameter matches the ' +
            'cron.key environment variable.');
        return null;
    }
    const currentTime = new Date(); //Time in UNIX Time Stamp
    const currentTimeSeconds = (currentTime.getHours() * hourstoseconds) + (currentTime.getMinutes() * minutestoseconds) + currentTime.getSeconds();
    console.log("Check 1 Passed!");
    console.log("Current Time is " + currentTimeSeconds);
    /*Safety check to make sure users who forget to disconnect their charger stop receiving notifications after 12:00 AM.
    May set to an earlier time depending on what we need to specify. Leave a safe gap for incoming http requests*/
    if (currentTimeSeconds > 0 && currentTimeSeconds < 3600){
        currentUsersRef.remove()
            .then(resp => {
                return "Resetting the CurrentUsers node for today's charger usage.";
            })
            .catch(err => {
                console.error("Issue with removing the CurrentUsers node.", err);
            });
    }
    currentUsersRef.once('value', function (snapshot) {
        console.log("Check 2 Passed!");
        console.log("snapshot is" + snapshot);
        snapshot.forEach(function (childSnapshot) {
            console.log("childSnapshot is " + childSnapshot);
            if (childSnapshot.val() < currentTimeSeconds) {
                flag = 1;
                const message: admin.messaging.Message = {
                    token: childSnapshot.key,
                    android: {
                        priority: "high",
                        "notification": {
                            "title": "Your set time has expired!",
                            "body": "Your set time has expired. Please disconnect your charger.",
                        },
                        data: {
                            title: "Your set time has expired!",
                            body: "Your set time has expired. Please disconnect your charger.",
                        }
                    },
                    'apns': {
                        'headers': {
                            'apns-priority': "10"
                        },
                        payload: {
                            'aps': {
                                'alert': {
                                    'title': "Your set time has expired!",
                                    'body': "Your set time has expired. Please disconnect your charger.",
                                },
                                'badge': 1,
                                'sound': "default"
                            }
                        }
                    }
                };
                console.log("Current token is " + message.token);
                admin.messaging().send(message)
                    .then(resp => {
                        console.log("Message sent successfully.", resp);
                    })
                    .catch(err => {
                        console.error("Could not send notification.", err);
                    });
            }
            // Send a notification if user has used up almost all of his allotted time
            else if (childSnapshot.val() < currentTimeSeconds + thirtyminutes) {
                const timeremaining = Math.floor( (currentTimeSeconds + thirtyminutes - childSnapshot.val() ) / 60);
                flag = 1;
                const message: admin.messaging.Message = {
                    token: childSnapshot.key,
                    android: {
                        priority: "high",
                        "notification": {
                            "title": "Your set time is almost up! " + timeremaining + " minute(s) left.",
                            "body": "Your set time is almost up. Plan to move your charger in " + timeremaining ,
                        },
                        data: {
                            title: "Your set time is almost up! " + timeremaining + " minute(s) left.",
                            body: "Your set time is almost up. Plan to move your charger in " + timeremaining,
                        }
                    },
                    'apns': {
                        'headers': {
                            'apns-priority': "10"
                        },
                        payload: {
                            'aps': {
                                'alert': {
                                    'title': "Your set time is almost up! " + timeremaining + " minute(s) left.",
                                    'body': "Your set time is almost up. Plan to move your charger in " + timeremaining,
                                },
                                'badge': 1,
                                'sound': "default"
                            }
                        }
                    }
                };
                console.log("Current token is " + message.token);
                admin.messaging().send(message)
                    .then(resp => {
                        console.log("Message sent successfully.", resp);
                    })
                    .catch(err => {
                        console.error("Could not send notification.", err);
                    });
            }
            return false;
        });
    })
        .catch(err => {
            console.log("RIP");
        })
    if (flag === 0) {
        console.log('No users registered for notifications');
        res.send('No users registered for notifications');
        return "No users registered for notifications";
    }
    console.log('Sent a message to a user(s)');
    res.send('Sent a message to a user(s)');
    return "Sent a message to a user(s)";
});

exports.nextInQueue = functions.database.ref('currentChargerDeviceTokens/').onWrite( snapshot => {
    let flag = 0; //Check if we sent a message
    snapshot.forEach(function (childSnapshot) {
            if (childSnapshot.exists()) {
                console.log("childSnapshot is " + childSnapshot);
                console.log("childSnapshot.val().devicetoken is  " + childSnapshot.val().devicetoken);
                console.log("childSnapshot.val().chargerName is " + childSnapshot.val().chargerName);

                const message: admin.messaging.Message = {
                    token: childSnapshot.val().devicetoken,
                    android: {
                        priority: "high",
                        "notification": {
                            "title": "You may now connect to charger " + childSnapshot.val().chargerName,
                            "body": "You are now allowed to connect to charger " + childSnapshot.val().chargerName,
                        },
                        data: {
                            title: "You may now connect to charger " + childSnapshot.val().chargerName,
                            body: "You are now allowed to connect to charger " + childSnapshot.val().chargerName,
                        }
                    },
                    'apns': {
                        'headers': {
                            'apns-priority': "10"
                        },
                        payload: {
                            'aps': {
                                'alert': {
                                    "title": "You may now connect to charger " + childSnapshot.val().chargerName,
                                    "body": "You are now allowed to connect to charger " + childSnapshot.val().chargerName,
                                },
                                'badge': 1,
                                'sound': "default"
                            }
                        }
                    }
                }
                flag = 1;
                console.log("Current token is " + message.token);
                admin.messaging().send(message)
                    .then(resp => {
                        console.log("Message sent successfully.", resp);
                    })
                    .catch(err => {
                        console.error("Could not send notification.", err);
                    });
            }
            });
    if (flag === 0) {
        console.log('No users registered for notifications');
        return "No users registered for notifications";
    }
    console.log('Sent a message to a user(s)');
    return "Sent a message to a user(s)";
});
