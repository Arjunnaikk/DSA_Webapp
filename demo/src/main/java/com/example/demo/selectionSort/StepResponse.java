package com.example.demo.selectionSort;

class StepResponse {
    private String message;
    private SortingState state;
    private int stepNumber;
    
    public StepResponse(String message, SortingState state, int stepNumber) {
        this.message = message;
        this.state = state;
        this.stepNumber = stepNumber;
    }
    
    public String getMessage() {
        return message;
    }
    
    public SortingState getState() {
        return state;
    }
    
    public int getStepNumber() {
        return stepNumber;
    }
}