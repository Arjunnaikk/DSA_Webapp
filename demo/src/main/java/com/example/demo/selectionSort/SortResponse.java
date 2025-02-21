package com.example.demo.selectionSort;

import java.util.List;

class SortResponse {
    private String message;
    private int[] originalArray;
    private List<Integer> sortedArray;
    private int totalSteps;
    
    public SortResponse(String message, int[] originalArray, List<Integer> sortedArray, int totalSteps) {
        this.message = message;
        this.originalArray = originalArray;
        this.sortedArray = sortedArray;
        this.totalSteps = totalSteps;
    }
    
    public String getMessage() {
        return message;
    }
    
    public int[] getOriginalArray() {
        return originalArray;
    }
    
    public List<Integer> getSortedArray() {
        return sortedArray;
    }
    
    public int getTotalSteps() {
        return totalSteps;
    }
}