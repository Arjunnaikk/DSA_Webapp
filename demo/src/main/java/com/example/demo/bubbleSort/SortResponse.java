package com.example.demo.bubbleSort;

import java.util.List;

public class SortResponse {

    private String message;
    private int[] originalArray;
    private int[] sortedArray;
    private int totalSteps;
    
    public SortResponse(String message, int[] originalArray,int[] sortedArray, int totalSteps) {
        this.message = message;
        this.originalArray = originalArray;
        this.sortedArray = sortedArray;
        this.totalSteps = totalSteps;
    }

    public SortResponse() {
        // Default constructor
    }   
    
    public String getMessage() {
        return message;
    }
    
    public int[] getOriginalArray() {
        return originalArray;
    }
    
    public int[] getSortedArray() {
        return sortedArray;
    }
    
    public int getTotalSteps() {
        return totalSteps;
    }

    public void setMessage(String message) {
        this.message = message;
    }   

    public void setOriginalArray(int[] originalArray) {
        this.originalArray = originalArray;
    }

    public void setSortedArray(int[] sortedArray) {
        this.sortedArray = sortedArray;
    }

    public void setTotalSteps(int totalSteps) {
        this.totalSteps = totalSteps;
    }   
}


