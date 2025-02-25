package com.example.demo.countSort;

import java.util.List;
import java.util.ArrayList;
import java.util.Arrays;

import org.springframework.stereotype.Service;

@Service
public class CountSortService {
    private List<SortState> sortSteps;
    
    public CountSortService() {
        this.sortSteps = new ArrayList<>();
    }
    
    public SortResponse initializeSort(SortRequest request) {
        sortSteps.clear();
        
        int[] inputArray = request.getArray();
        if (inputArray == null || inputArray.length == 0) {
            throw new IllegalArgumentException("Input array cannot be empty");
        }
        
        // Initialize first state
        SortState initialState = createInitialState(inputArray);
        sortSteps.add(initialState);
        
        // Generate all sorting steps
        generateAllSteps(inputArray);
        
        // Prepare response
        SortResponse response = new SortResponse();
        response.setMessage("Sorting initialized successfully");
        response.setOriginalArray(inputArray.clone());
        response.setSortedArray(sortSteps.get(sortSteps.size() - 1).getArray());
        response.setTotalSteps(sortSteps.size());
        
        return response;
    }
    
    public List<StepResponse> getAllSteps() {
        List<StepResponse> responses = new ArrayList<>();
        for (int i = 0; i < sortSteps.size(); i++) {
            StepResponse response = new StepResponse();
            response.setMessage("Step " + (i + 1) + " of " + sortSteps.size());
            response.setState(sortSteps.get(i));
            response.setStepNumber(i);
            responses.add(response);
        }
        return responses;
    }
    
    public StepResponse getStep(int stepNumber) {
        if (stepNumber < 0 || stepNumber >= sortSteps.size()) {
            throw new IllegalArgumentException("Invalid step number");
        }
        
        StepResponse response = new StepResponse();
        response.setMessage("Step " + (stepNumber + 1) + " of " + sortSteps.size());
        response.setState(sortSteps.get(stepNumber));
        response.setStepNumber(stepNumber);
        return response;
    }
    
    private SortState createInitialState(int[] inputArray) {
        SortState state = new SortState();
        state.setArray(inputArray.clone());
        state.setInitialArray(inputArray.clone());
        state.setCurrentIndex(0);
        state.setArrayVisibility(new int[inputArray.length]); // Initialize array with all 1s
        Arrays.fill(state.getArrayVisibility(), 1);
        state.setCounter(new int[10]);
        state.setShowCountArray(true);
        state.setSortedIndices(new ArrayList<>());
        state.setCompleted(false);
        state.setAnimation(null);
        return state;
    }
    
    private void generateAllSteps(int[] inputArray) {
        // int max = Arrays.stream(inputArray).max().getAsInt();
        int[] count = new int[10];
        int[] output = new int[inputArray.length];
        
        // Set phase
        for (int i = 0; i < inputArray.length; i++) {
            SortState countingState = createNewState();
            countingState.setCurrentIndex(i);
            count[inputArray[i]]++;
            countingState.setCounter(count.clone());
            countingState.setAnimation("set");
            countingState.setShowCountArray(true);

            int[] visibleArray = new int[inputArray.length];
            for (int j = 0; j < inputArray.length; j++) {
                if(j <= i) {
                    visibleArray[j] = 0;
                } else {
                visibleArray[j] = 1;
            }
        }
            countingState.setArrayVisibility(visibleArray); 
            
            sortSteps.add(countingState);
        }
        
        // Get phase
        for (int i = 0; i < inputArray.length; i++) {
            SortState countingState = createNewState();
            List<Integer> sortedIndices = new ArrayList<>();

            countingState.setCurrentIndex(i);
            countingState.setAnimation("get");
            countingState.setShowCountArray(true);

            int[] visibleArray = new int[inputArray.length];
            for (int j = 0; j < inputArray.length; j++) {
                if(j <= i) {
                    visibleArray[j] = 1;
                } else {
                visibleArray[j] = 0;
                }
            }
            countingState.setArrayVisibility(visibleArray); 

            int[] temp = sortSteps.get(sortSteps.size() - 1).getArray().clone();
            for(int j = 0; j < count.length; j++) {
                if(count[j] > 0){
                        temp[i] = j;
                        count[j] = count[j] - 1;   
                        break;
                    }
                    
            }

            countingState.setArray(temp);   
            countingState.setCounter(count.clone());
            for (int j = 0; j < inputArray.length - 1; j++) {
                if(i <= j) {
                    sortedIndices.add(j);   
                } 
            }
            countingState.setSortedIndices(sortedIndices);
            sortSteps.add(countingState);
        }


        // Calculate cumulative count
        // for (int i = 1; i < count.length; i++) {
        //     SortState cumulativeState = createNewState();
        //     count[i] += count[i - 1];
        //     cumulativeState.setCounter(count.clone());
        //     cumulativeState.setAnimation("cumulative");
        //     sortSteps.add(cumulativeState);
        // }
        
        // Build output array
        // for (int i = inputArray.length - 1; i >= 0; i--) {
        //     SortState placementState = createNewState();
        //     output[count[inputArray[i]] - 1] = inputArray[i];
        //     count[inputArray[i]]--;
        //     placementState.setArray(output.clone());
        //     placementState.setCurrentIndex(i);
        //     placementState.setCounter(count.clone());
        //     placementState.setAnimation("placement");
        //     sortSteps.add(placementState);
        // }
        
        // Final state
        SortState finalState = createNewState();
        List<Integer> sortedIndices = new ArrayList<>();
        for (int i = 0; i < inputArray.length - 1; i++) {
            sortedIndices.add(i);
        }
        finalState.setCompleted(true);
        finalState.setShowCountArray(false);
        finalState.setAnimation(null);
        finalState.setCurrentIndex(inputArray.length - 1);
        finalState.setSortedIndices(sortedIndices);
        sortSteps.add(finalState);
    }
    
    private SortState createNewState() {
        SortState previousState = sortSteps.get(sortSteps.size() - 1);
        SortState newState = new SortState();
        
        newState.setArray(previousState.getArray().clone());
        newState.setInitialArray(previousState.getInitialArray().clone());
        newState.setArrayVisibility(previousState.getArrayVisibility().clone());
        newState.setCounter(previousState.getCounter().clone());
        newState.setShowCountArray(true);
        newState.setSortedIndices(new ArrayList<>(previousState.getSortedIndices()));
        
        return newState;
    }
}
