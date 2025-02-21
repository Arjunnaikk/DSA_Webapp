package com.example.demo.insertionSort;

public class StepResponse {

        private String message;
        private SortState state;
        private int stepNumber;
        
        public StepResponse(String message, SortState state, int stepNumber) {
            this.message = message;
            this.state = state;
            this.stepNumber = stepNumber;
        }
        
        public String getMessage() {
            return message;
        }
        
        public SortState getState() {
            return state;
        }
        
        public int getStepNumber() {
            return stepNumber;
        }
    }



