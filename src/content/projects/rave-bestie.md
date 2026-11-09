---
title: RaveBestie
description: A festival companion for planning which sets to see, finding out which friends are going and keeping a history of every artist you've seen.
date: 2026-04-14
status: building
tags: [Java, Spring Boot, PostgreSQL, Spring Security, Flyway]
---

Festival line-ups are huge and the clashes are painful. RaveBestie is the backend for an app that helps you and your friends plan a festival together.

## Features so far

- **Festivals, stages and timetables**, with a "now playing" view for each festival. Timetables are brought in through an importer.
- **Your schedule.** Pick the performances you want to see.
- **Friends.** Send and accept friend requests, and see which friends are going to the same festival.
- **History.** Every set you attend becomes an artist sighting, so your profile shows everyone you've seen and some stats.
- **Sign in with Apple or Google**, with JWT access tokens and refresh tokens.

## Built with

Java and Spring Boot, Spring Security as an OAuth2 resource server, Spring Data JPA, PostgreSQL and Flyway migrations.
