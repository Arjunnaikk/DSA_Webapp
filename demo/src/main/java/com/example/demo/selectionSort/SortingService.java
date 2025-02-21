package com.example.demo.selectionSort;

import org.springframework.boot.autoconfigure.data.web.SpringDataWebProperties.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SortingService {
    
    public SortingState initialize(int[] array) {
        SortingState state = new SortingState();
        state.setArray(Arrays.stream(array).boxed().collect(Collectors.toList()));
        state.setCurrentIndex(0);
        state.setMinIndex(0);
        state.setSortedIndices(new ArrayList<>());
        state.setCompleted(false);
        state.setInitialArray(null);
        return state;
    }

    private List<SortingState> steps = new ArrayList<>();
    private int[] initialArray;

    public SortResponse initSort(SortRequest request) {
        // Reset steps and save the initial array
        steps.clear();
        initialArray = request.getArray();
        
        // Create a copy for sorting
        int[] array = Arrays.copyOf(initialArray, initialArray.length);
        
        // Perform selection sort with tracking
        selectionSortWithSteps(array);
        
        SortingState finalState = steps.get(steps.size() - 1);
        return new SortResponse(
            "Selection sort completed successfully",
            initialArray,
            finalState.getArray(),
            steps.size() 
        );
    }

    private void selectionSortWithSteps(int[] arr) {
        int n = arr.length;
        List<Integer> sortedIndices = new ArrayList<>();

        // steps.add(new SortingState(
        //             Arrays.stream(arr).boxed().collect(Collectors.toList()),
        //             0,
        //             0,
        //             new ArrayList<>(sortedIndices),
        //             false,
        //             Arrays.stream(initialArray).boxed().collect(Collectors.toList())
        //         ));

        for (int i = 0; i < n - 1; i++) {
            int minIdx = i;
            
            for (int j = i + 1; j < n; j++) {

                
                steps.add(new SortingState(
                    Arrays.stream(arr).boxed().collect(Collectors.toList()),
                    i,
                    minIdx,
                    new ArrayList<>(sortedIndices),
                    false,
                    Arrays.stream(initialArray).boxed().collect(Collectors.toList())
                ));
                if (arr[j] < arr[minIdx]) {
                    minIdx = j;
                    
                    // Save state when we find a new minimum
                }
                
            }
            
            steps.add(new SortingState(
                Arrays.stream(arr).boxed().collect(Collectors.toList()),
                i,
                minIdx,
                new ArrayList<>(sortedIndices),
                false, // isCompleted will be true on the last iteration
                Arrays.stream(initialArray).boxed().collect(Collectors.toList())
            ));
            // Swap found minimum element with first element
            int temp = arr[minIdx];
            arr[minIdx] = arr[i];
            arr[i] = temp;
            
            // Add to sorted indices
            sortedIndices.add(i);
            
            // Save state after swap
        }

        steps.add(new SortingState(
            Arrays.stream(arr).boxed().collect(Collectors.toList()),
            n - 1,
            n - 1,
            new ArrayList<>(sortedIndices),
            false, // isCompleted will be true on the last iteration
            Arrays.stream(initialArray).boxed().collect(Collectors.toList())
        ));
        
        // Add final state with all indices sorted
        sortedIndices.add(n - 1);
        steps.add(new SortingState(
            Arrays.stream(arr).boxed().collect(Collectors.toList()),
            n - 1,
            n - 1,
            sortedIndices,
            true,
            Arrays.stream(initialArray).boxed().collect(Collectors.toList())
        ));
    }
    
    public SortingState processNextStep(SortingStep step) {
        if (step.isReset()) {
            return initialize(step.getArray());
        }
        
        SortingState state = new SortingState();
        ArrayList<Integer> array = Arrays.stream(step.getArray())
            .boxed()
            .collect(Collectors.toCollection(ArrayList::new));
        
        int currentIndex = step.getCurrentIndex();
        int minIndex = currentIndex;
        
        // Find minimum element
        for (int i = currentIndex + 1; i < array.size(); i++) {
            if (array.get(i) < array.get(minIndex)) {
                minIndex = i;
            }
        }
        
        // Swap elements
        int temp = array.get(currentIndex);
        array.set(currentIndex, array.get(minIndex));
        array.set(minIndex, temp);
        
        // Update state
        state.setArray(array);
        state.setCurrentIndex(currentIndex + 1);
        state.setMinIndex(minIndex);
        
        // Update sorted indices
        ArrayList<Integer> sortedIndices = new ArrayList<>();
        for (int i = 0; i <= currentIndex; i++) {
            sortedIndices.add(i);
        }
        state.setSortedIndices(sortedIndices);
        
        // Check if sorting is completed
        state.setCompleted(currentIndex >= array.size() - 1);
        
        return state;
    }

    public StepResponse getStep(int stepNumber) {
        if (steps.isEmpty()) {
            return new StepResponse("No sorting has been performed yet", null, -1);
        }
        
        if (stepNumber < 0 || stepNumber >= steps.size()) {
            return new StepResponse("Invalid step number", null, -1);
        }
        
        return new StepResponse(
            "Step retrieved successfully",
            steps.get(stepNumber),
            stepNumber
        );

    }




}