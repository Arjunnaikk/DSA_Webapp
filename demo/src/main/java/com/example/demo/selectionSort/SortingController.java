package com.example.demo.selectionSort;

import java.util.Arrays;

import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/sort/selection")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class SortingController {
    
    private final SortingService sortingService;
    
    // @PostMapping("/init")
    // public SortingState initializeSorting(@RequestBody int[] array) {
    //     return sortingService.initialize(array);
    // }
    
    @PostMapping("/step")
    public SortingState nextStep(@RequestBody SortingStep step) {
        return sortingService.processNextStep(step);
    }

    @PostMapping("/init")
    public SortResponse initSort(@RequestBody SortRequest request) {
        return sortingService.initSort(request);
    }

    @GetMapping("/step/{stepNumber}")
    public StepResponse getStep(@PathVariable int stepNumber) {
        return sortingService.getStep(stepNumber);
    }

}