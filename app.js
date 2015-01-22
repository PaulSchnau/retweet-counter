var sys = require("sys");
var util = require('util');
var Twit = require('twit');
var prompt = require('prompt');
var T = new Twit({
    consumer_key: '8AqQCy7umStCyNN356v7fw'
    , consumer_secret: 'vOvKV1QwuS1AeKPMIvJqErBxW7i1N12OL4UY2tNMs0c'
    , access_token: '29463499-9Og6hxW4HqFxcQyIrAdmLpbAnrwIk290ghOE0ez5f'
    , access_token_secret: 'elXVYJRFmFFit3PiVTmI9eU0IvHqqD7H4yeEmClJ8c'
});

var minutes; //User inputed minutes
var tweetText = {}; //Object of {tweetID: tweetString}
var tweets = {}; //Object of {tweetID: [time]} where each time represents a retweet.
var retweetTotals = {}; //Object of {tweetID: numReteweets}
var orderedTweets = []; //Array of [tweetID, numRetweets]
var timeOfLastDisplay= new Date();
var timeToDisplayNext = new Date();

function promptUser(){
    console.log("Count retweets for how long of a time?");
    prompt.start();
    prompt.get(['minutes'], function (err, result) {
        minutes = parseInt(result.minutes);
        startStream();
    });
}


function addRetweet(tweetID, time, originalTweet){
    if (originalTweet) {
        tweets[tweetID] = [];
    } else if(tweets[tweetID] == undefined){
        tweets[tweetID] = [time];
    } else {
        tweets[tweetID].push(time);
    }
}


function tallyTweets(){
    retweetTotals = {};
    var now = new Date();
    var cutoffTime = new Date();
    cutoffTime.setTime(now.getTime() - (minutes * 60 * 1000));
    cutoffTime.setMinutes(cutoffTime.getMinutes() - minutes);
    for (var tweetID in tweets) {
        for (var i = 0; i < tweets[tweetID].length; i++) {
            if (cutoffTime < tweets[tweetID][i]){
                if (retweetTotals[tweetID] === undefined) {
                    retweetTotals[tweetID] = 1;
                } else {
                    retweetTotals[tweetID] = retweetTotals[tweetID] +1;
                }
            }
        }
    }
    orderedTweets = [];
    for (var tweetID in retweetTotals){
        orderedTweets.push([tweetID, retweetTotals[tweetID]]);
    }
    orderedTweets.sort(function(a, b) {return b[1] - a[1]});  
}

function startStream(){
    var stream = T.stream('statuses/sample', {})
    stream.on('tweet', function (tweet) {
        tweetText[tweet.id]=tweet.text;
        if (tweet.retweeted_status){
            addRetweet(tweet.retweeted_status.id, new Date(), false);
            tweetText[tweet.retweeted_status.id]=tweet.retweeted_status.text;
        } else {
            addRetweet(tweet.id, new Date(), true);
        }
        tallyTweets();
        displayTweets();
    });
}

function displayTweets(){
    if(new Date() > timeToDisplayNext) {
        var topTweetsString = "Top Retweets in the last " + minutes + " minutes: \n";
        for (var i = 0; i < 10; i++) {
            if (orderedTweets.length < 10) break;
            var tweetMessage =  tweetText[orderedTweets[i][0]].substring(0, 40).replace(/\s+/g," ");
            topTweetsString +=(i+1) + ". " + orderedTweets[i][1] + " Retweets: "+ tweetMessage + "..\n" ;
        }
        timeOfLastDisplay = new Date();
        timeToDisplayNext = timeOfLastDisplay.setTime(timeOfLastDisplay.getTime() + 1000);
        console.log(topTweetsString);
    }
}


promptUser();