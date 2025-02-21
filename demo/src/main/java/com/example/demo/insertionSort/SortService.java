package com.example.demo.insertionSort;

import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
public class SortService {
    private List<SortState> steps = new ArrayList<>();
    private int[] currentArray;
    private int stepCount = 0;

    public SortResponse initSort(SortRequest request) {
        int[] array = request.getArray();
        currentArray = request.getArray().clone();
        steps.clear();
        stepCount = 0;

        int[] sortedArray = array.clone();
        List<Integer> sortedIndices = new ArrayList<>();
        sortedIndices.add(0);

        // Perform insertion sort and store steps
        for (int i = 1; i < sortedArray.length; i++) {
            int key = sortedArray[i];
            int j = i - 1;
            
            // Add initial step for current iteration
            addStep(sortedArray.clone(), i, i, sortedIndices, false, array, "down");
            
            while (j >= 0 && sortedArray[j] > key) {
                // Add comparison step
                // addStep(sortedArray.clone(), i, j, sortedIndices, false, array, "up");
                
                // Shift elements
                sortedArray[j + 1] = sortedArray[j];
                sortedArray[j] = key;   
                
                // Add shift step
                addStep(sortedArray.clone(), j + 1, j, sortedIndices, false, array, "swap");
                
                j--;
            }

            if( j != -1){
                addStep(sortedArray.clone(), j + 1, j, sortedIndices, false, array, "");
            }
            
            sortedArray[j + 1] = key;
            sortedIndices.add(i);
            
            // Add step after insertion
            addStep(sortedArray.clone(), j + 1, j + 1, sortedIndices, false, array, "up");
        }

        // Add final sorted index and final step
        // sortedIndices.add(sortedArray.length - 1);
        addStep(sortedArray.clone(), sortedArray.length - 1, sortedArray.length - 1, sortedIndices, true, array, "");

        // Create response
        SortResponse response = new SortResponse();
        response.setMessage("insertion sort completed successfully");
        response.setOriginalArray(array);
        response.setSortedArray(sortedArray);
        response.setTotalSteps(steps.size());

        return response;
    }

    private void addStep(int[] sortedArray, int currentIndex, 
                        int comparingIndex, List<Integer> sortedIndices, 
                        boolean isCompleted, int[] initialArray, 
                        String animation) {
        SortState state = new SortState();
        state.setArray(sortedArray);
        state.setCurrentIndex(currentIndex);
        state.setComparingIndex(comparingIndex);
        state.setSortedIndices(new ArrayList<>(sortedIndices));
        state.setCompleted(isCompleted);
        state.setInitialArray(initialArray);
        state.setAnimation(animation);
        steps.add(state);
    }

    public StepResponse getStep(int stepNumber) {
        if (stepNumber < 0 || stepNumber > steps.size() - 1) {
            throw new IllegalArgumentException("Invalid step number");
        }
        return new StepResponse(
            "Step retrieved successfully",
            steps.get(stepNumber),
            stepNumber
        );
    }

    public List<SortState> getAllSteps() {
        return steps;
    }
}