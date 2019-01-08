# SimpleFirebaseMessageScheduler
A simple firebase cloud function written for sending push notifications to a phone. Tested for Android and iOS! Code is found in the index.js file.

The LazyScheduler function is working, but the nextInQueue function is in beta. Be careful on using it.

# Requirements
Requires an external service to ping a specific URL to generate such notifications. I recommend using 

https://cron-job.org 

as it allows for scheduling every minute, which is a fairly fast way to schedule notifications. However, 15 minutes is typically a good time to start for notifying users.

The messaging portion of the function written will not work without a prior setup of push notifications. I used the [Phonegap-plugin-push](https://github.com/phonegap/phonegap-plugin-push) to implement this part, but you are free to customize it as you need.

Next, make sure the dependencies are installed. Run `npm install`.
Finally, make sure you follow the below steps to get the function working on your end.

# Deploy and Test
The documentation is attributed to the [Firebase Function-Samples Documentation](https://github.com/firebase/functions-samples/tree/master/delete-unused-accounts-cron) with slight modifications on my end for present use.

Set the cron.key Google Cloud environment variables to a randomly generated key, this will be used to authorize requests coming from the 3rd-party cron service. For this use:

`firebase functions:config:set cron.key="YOUR-KEY"`

You can generate a random key, for instance, by running:

`node -e "console.log(require('crypto').randomBytes(20).toString('hex'))"`

This command will work provided you have Node.js installed.

To set up the sample:

1. Create a Firebase Project using the Firebase Developer Console
2. Download this sample e.g. `git clone https://github.com/KingJackFrost/SimpleFirebaseMessageScheduler`
3. Enter the sample directory `cd SimpleFirebaseMessageScheduler`
4. Setup the sample with your project `firebase use --add` and follow the instructions.
5. Install node dependencies of your Functions `cd functions; npm install; cd -`
6. Deploy your project using `firebase deploy`.
Using a 3rd party cron service, setup a daily cron job to hit the URL (don't forget to change [YOUR-KEY] and [PROJECT-ID]):
  
`https://us-central1-<PROJECT-ID>.cloudfunctions.net/LazyScheduler?key=<YOUR-KEY>`
