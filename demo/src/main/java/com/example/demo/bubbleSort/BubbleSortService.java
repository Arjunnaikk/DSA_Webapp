package com.example.demo.bubbleSort;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
public class BubbleSortService {
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

        // Perform bubble sort and store steps
        int n = sortedArray.length;
        for (int i = 0; i < n - 1; i++) {
            // Add newly sorted index from previous iteration
            if (i > 0) {
                sortedIndices.add(n - i);
            }
            
            for (int j = 0; j < n - i - 1; j++) {
                addStep(sortedArray.clone(), j + 1, j , sortedIndices, false, array, null);
                // Add step before comparison
                
                if (sortedArray[j] > sortedArray[j + 1]) {
                    // Swap elements
                    int temp = sortedArray[j];
                    sortedArray[j] = sortedArray[j + 1];
                    sortedArray[j + 1] = temp;
                    
                    // Add step after swap
                    addStep(sortedArray.clone(), j + 1, j, sortedIndices, false, array, "swap");
                }
            }
        }

        // Add final sorted index and step
        sortedIndices.add(0);
        addStep(sortedArray.clone(), n - 1, n - 1, sortedIndices, true, array, null);

        // Create response
        SortResponse response = new SortResponse();
        response.setMessage("bubble sort completed successfully");
        response.setOriginalArray(array);
        response.setSortedArray(sortedArray);
        response.setTotalSteps(steps.size());

        return response;
    }

    private void addStep(int[] sortedArray, int swapIndex, 
                        int comparingIndex, List<Integer> sortedIndices, 
                        boolean isCompleted, int[] initialArray, 
                        String animation) {
        SortState state = new SortState();
        state.setArray(sortedArray);
        state.setSwapIndex(swapIndex);
        state.setComparingIndex(comparingIndex);
        state.setSortedIndices(new ArrayList<>(sortedIndices));
        state.setIsCompleted(isCompleted);
        state.setInitialArray(initialArray);
        state.setAnimation(animation);  // Will be either "swap" or null
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