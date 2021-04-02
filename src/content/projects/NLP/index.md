---
title: "Twitter Sentiment Analysis"
tags: ["Python", "Natural Language Processing", "Tweepy", "NLTK", "Pandas"]
date: "2020-11-01"
---
<center> <h1> SWE 522 Requirement Engineering<br /> Crowd RE Report</h1>   </center>

## I. Introduction - Motivation
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**Cyberpunk 2077** is an action role-playing video game developed and published by CD Projekt company. This game first was announced in May 2012 and from this time it created big expectations among the gaming community. The initial release date of the game was first announced 16 April 2020 but delayed **3 times** and finally released **10 December 2020**. This situation increased expectations over the game. When the game finally released, it brought big attention over the media and gaming communities. The game sold **13 million** copies on its first day.

However with the release of the game, a huge controversy started. Gamers find themselves with **a lot of bugs** and unfinished gaming maps and many crashes shut down during game playing. This resulted in many negative reviews on social media and gaming blogs. However, **CD Projekt** worked very hard on the game and brought a big update with **Patch 1.1**. This patch was released on 22nd of January and already downloaded millions of players. Patch 1.1 contains many bug fixes, performance updates and crash problem fixes.

In this assignment, we are going to analyse tweets using **sentiment analysis** and try to understand how users responded to the new update. Our aim is to analyse how the new update changed users' thoughts on Cyberpunk 2077. With sentiment analysis we will determine the percentage of tweets in negative, positive and neutral feelings. We will analyse the tweets between 4 days before and 4 days after patch release. Then we will compare how Patch 1.1 impacted the feelings of the users.


### Technology and Libraries we used:

- Python (Programming Language)

- Tweepy (Python library to connect Twitter)

- NLTK (Python library to do sentiment analysis)

- Pandas (Python data analysis library)

## II. Problem Description

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;The hype around **Cyberpunk 2077** video game had been building for nearly a decade. Expectation about the game was highest by the gaming community. However Cyberpunk 2077 game came with many **bugs, glitches and problems**. The CD Projekt company, developer of the game, announced that they will fix these problems with the next update. After 42 days of game release, **22nd of January**, the company released their biggest update with Patch 1.1. With this patch company acclaimed that they fixed most of the problems in the game and increased performance.

In this article, we are going to analyze how users think about the new update. How their thoughts about the game are changed with the new update. Are gamers **happy** with the new update? Or gamers more **unhappy** with the new update? We are going to try to find answers for those questions.

## III. Methods

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;In this project we have used a simple program to get the tweets using the keyword **‘Cyberpunk’** and then run sentiment analysis on the text body of the tweet. To get the tweets we created developer accounts on Twitter to get the API keys. We used the Tweepy library with the API keys we generated to do a search for the tweets. We analyzed over **5000** tweets from **9** different days centering around the release of the **Patch 1.1**.

After getting the tweets from the API we had to preprocess them before doing the sentiment analysis since retweets of a popular tweet would alter the results we were going after. After clearing the retweets from the data we ran a sentiment analysis on the test body of the tweet using a function from the **NLTK library**. Each tweet received a score value for their **positivity** and **negativity** depending on the words used. The tweets were classified using these scores into three groups: positive, negative, neutral. After the classification we compared how the number of tweets in each category had changed over the given time.

## IV. Conclusions

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;After analyzing the data we could clearly see how the update had **affected the users**. There were 2 clear breaking points in the data. The **first** one is the release date of Patch 1.1 and the **second** one is when the users found a possibly game breaking bug in the game and major games news sites picked it up. This bug is when a critical non player character in the game can’t talk with the player so the progress of the player stops and they can’t continue forward with the story.

If we take a closer look at the data around the release date of the patch we can see that during the days leading to the patch positive tweets were on a **decline** while negative and neutral tweets were fluctuating. After the release date we can see that on the first day the **neutral tweets** had a huge rise and the other two categories lost numbers. This may be due to the fact that with the biggest update since the release of the game the players needed time before giving a verdict. After the first day we can see that the positive tweets were increasing significantly compared to before while the neutral tweets lost their previous high number.

**The second major point** is the founding of the new bug. Major games news sites published articles about the bug and it gained widespread attention. After this we can see a **clear decrease in the number of the positive tweets** while neutral tweets gain the lost numbers from it. It looks like the trend we see around the release day of Patch 1.1 with the increase of the neutral tweets. For a better analysis, analysing tweets from the following days would be needed.

![Alt text](https://github.com/athelvaci/twitter-sentiment-analysis/blob/master/sentimentAnalysesResult.png "Sentiment analyses result")


## V. Discussion - Future Work

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; From the results we can see that we can clearly correlate the **public’s feelings with the updates and news on the game**. With deeper analysis using **classification** and **natural language processing libraries** it would be possible to extract the root cause of the response from the players. In this case a first look would probably tie negative tweets with crashes and bugs while the positive tweets would be story and graphics. However a deeper analysis may provide the specific bug or the story feature that the user was tweeting about.

Twitter is one of the resources to access data for this topic. However, twitter api provides a limited amount of data to analyse. For this reason this research can be improved and extended by other sources such as **Steam comments**, **Reddit blog posts** etc. Combining these different sources of user feedback would allow the researcher to get a better understanding of the reception of the game or the update.


## VI. Contributors
- **Ali Onat Üner**
- **Ahmet Tufan Helvacı**

