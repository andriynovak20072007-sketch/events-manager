package com.example.eventmanager;

public class Event {
    private String title;
    private String location;
    private String date;
    private int imageResId;

    public Event(String title, String location, String date, int imageResId) {
        this.title = title;
        this.location = location;
        this.date = date;
        this.imageResId = imageResId;
    }

    // Ці методи ОБОВ'ЯЗКОВО мають бути тут!
    public String getTitle() { return title; }
    public String getLocation() { return location; }
    public String getDate() { return date; }
    public int getImageResId() { return imageResId; }
}