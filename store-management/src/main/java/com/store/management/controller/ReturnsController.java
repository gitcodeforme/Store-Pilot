package com.store.management.controller;

import com.store.management.dto.ReturnsDTO;
import com.store.management.service.ReturnsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigInteger;
import java.util.List;

@RestController
@RequestMapping("/api/returns")
public class ReturnsController {

    @Autowired
    private ReturnsService returnService;

    @GetMapping
    public List<ReturnsDTO> getAllReturns() {
        return returnService.getAllReturns();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReturnsDTO> getReturnById(@PathVariable Integer id) {
        return returnService.getReturnById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/customer/{customerId}")
    public List<ReturnsDTO> getReturnsByCustomerId(@PathVariable BigInteger customerId) {
        return returnService.getReturnsByCustomerId(customerId);
    }

    @GetMapping("/sale/{saleId}")
    public List<ReturnsDTO> getReturnsBySaleId(@PathVariable Integer saleId) {
        return returnService.getReturnsBySaleId(saleId);
    }

    @PostMapping("/create")
    public ResponseEntity<ReturnsDTO> createReturn(@RequestBody ReturnsDTO returnsDTO) {
        if (returnsDTO.getReturnType() == null || returnsDTO.getPaymentMode() == null) {
            return ResponseEntity.badRequest().body(null); // Required fields missing
        }
    
        returnsDTO.setReturnId(null); // Prevent accidental updates
        ReturnsDTO createdReturn = returnService.saveReturn(returnsDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdReturn);
    }    


    @PutMapping("/{id}")
    public ResponseEntity<ReturnsDTO> updateReturn(@PathVariable Integer id, @RequestBody ReturnsDTO returnDTO) {
        returnService.getReturnById(id)
            .orElseThrow(() -> new RuntimeException("Return not found"));
        returnDTO.setReturnId(id);
        ReturnsDTO updated = returnService.saveReturn(returnDTO);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReturn(@PathVariable Integer id) {
        if (returnService.getReturnById(id).isPresent()) {
            returnService.deleteReturn(id);
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
