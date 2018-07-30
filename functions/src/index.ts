const functions = require('firebase-functions');
const secureCompare = require('secure-compare');
//const admin = require('firebase-admin');
// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

import * as admin from 'firebase-admin';
//import * as firebase from 'firebase';

admin.initializeApp();
//Cron-key is 2a0771369b354abe3dacd0a3049b5342cd382773
 exports.LazyScheduler = functions.https.onRequest((req, res) => {
   let flag = 0; //Check if we sent a message
  const key = req.query.key;
  // Exit if the keys don't match.
  if (!secureCompare(key, functions.config().cron.key)) {
    console.log('The key provided in the request does not match the key set in the environment. Check that', key,
      'matches the cron.key attribute in `firebase env:get`');
    res.status(403).send('Security key does not match. Make sure your "key" URL query parameter matches the ' +
      'cron.key environment variable.');
    return null;
  }


  /*const userId = data.userId;
  const subscriber = data.subscriberId;

  // Notification content
  const payload = {
    notification: {
      title: 'New Subscriber',
      body: `${subscriber} is following your content!`,
      icon: 'https://goo.gl/Fz9nrQ'
    }
  }

  // ref to the device collection for the user
  const db = firebase.database();
  const devicesRef = db.ref('devices/{subscriptionId}');
  const tokens = [];

  // get the user's tokens and send notifications
  devicesRef.once('value', function(snapshot){
    snapshot.forEach(function(childSnapshot) {
      const token = childSnapshot.key;
      tokens.push(token);
    });

    });

  // send a notification to each device token

  return admin.messaging().sendToDevice(tokens, firebase)
  */

  // Notification content
  /*const payload = {
    notification: {
      title: 'Your car is done charging!',
      body: `Your set time has expired.`,
    }
  }*/

  //Get reference to the current users in place

  const db = admin.database();
  const currentUsersRef = db.ref('/CurrentUsers');
  const users = [];
  let currentTime = new Date(); //Time in UNIX Time Stamp
  let currentTimeSeconds = (currentTime.getHours() * 60 * 60) + (currentTime.getMinutes() * 60) + currentTime.getSeconds();
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
  console.log("Check 1 Passed!");
  console.log("Current Time is " + currentTimeSeconds);
  currentUsersRef.once('value', function (snapshot) {
    console.log("Check 2 Passed!");
    console.log("snapshot is" + snapshot);
    snapshot.forEach(function (childSnapshot) {
      console.log("childSnapshot is " + childSnapshot);
      if (childSnapshot.val() < currentTimeSeconds) {
        flag = 1;
        let message: admin.messaging.Message = {
          token: childSnapshot.key,
          android: {
            priority: "high",
            "notification": {
              "title": "Your car is done charging!",
              "body": "Your set time has expired.",
            },
            data: {
              title: "Your car is done charging!",
              body: "Your set time has expired.",
            }
          },
          'apns': {
            'headers': {
              'apns-priority': "10"
            },
            payload: {
              'aps': {
                'alert': {
                  'title': "Your car is done charging!",
                  'body': "Your set time has expired.",
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
        /*const user = childSnapshot.key;
        console.log("User is " + user);
        users.push(user);*/
      }
      return false;
    });
  })
    .catch(err => {
      console.log("RIP");
    })
  // send a notification to each device token
  /*if (users != null) {
    return admin.messaging().sendToDevice(users, payload);
  }*/
  if (flag == 0) {
    console.log('No users registered for notifications');
    res.send('No users registered for notifications');
    return "No users registered for notifications";
  }
   console.log('Sent a message to a user(s)');
   res.send('Sent a message to a user(s)');
   return "Sent a message to a user(s)";
})

