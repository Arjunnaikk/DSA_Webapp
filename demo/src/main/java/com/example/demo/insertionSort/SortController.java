package com.example.demo.insertionSort;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sort/insertion")
@CrossOrigin(origins = "*")
public class SortController {

    @Autowired
    private SortService sortService;

    @PostMapping("/init")
    public SortResponse initSort(@RequestBody SortRequest request) {
        return sortService.initSort(request);
    }

    @GetMapping("/step/{stepNumber}")
    public StepResponse getStep(@PathVariable int stepNumber) {
        return sortService.getStep(stepNumber);
    }

    @GetMapping("/steps")
    public List<SortState> getAllSteps() {
        return sortService.getAllSteps();
    }
}
