package com.example.demo.countSort;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sort/count")
public class CountSortController {

    @Autowired
    private final CountSortService sortingService;
    
    @Autowired
    public CountSortController(CountSortService sortingService) {
        this.sortingService = sortingService;
    }
    
    @PostMapping("/init")
    public SortResponse initializeSort(@RequestBody SortRequest request) {
            return sortingService.initializeSort(request);
    }
    
    @GetMapping("/steps")
    public List<StepResponse> getAllSteps() {
        return sortingService.getAllSteps();
    }
    
    @GetMapping("/step/{stepNumber}")
    public StepResponse getStep(@PathVariable int stepNumber) {
            return sortingService.getStep(stepNumber);
    }
}
