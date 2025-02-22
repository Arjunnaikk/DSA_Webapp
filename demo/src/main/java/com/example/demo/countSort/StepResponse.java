package com.example.demo.countSort;

public class StepResponse {

        private String message;
        private SortState state;
        private int stepNumber;
        
        public StepResponse(String message, SortState state, int stepNumber) {
            this.message = message;
            this.state = state;
            this.stepNumber = stepNumber;
        }
        public StepResponse() {
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

        public void setMessage(String message) {
            this.message = message;
        }

        public void setState(SortState state) {
            this.state = state;
        }

        public void setStepNumber(int stepNumber)
        {
            this.stepNumber = stepNumber;
        }   
    }



