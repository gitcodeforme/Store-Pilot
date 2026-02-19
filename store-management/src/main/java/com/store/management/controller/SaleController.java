package com.store.management.controller;

import com.store.management.dto.SaleDTO;
import com.store.management.service.SaleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sales")
public class SaleController {
            
    @Autowired
    private SaleService saleService;

    // Create a new sale
    @PostMapping("/create")
    public ResponseEntity<SaleDTO> createSale(@RequestBody SaleDTO saleDTO) {
        // Validate if essential fields are present
        if (saleDTO.getSaleType() == null || saleDTO.getPaymentMode() == null || saleDTO.getItems().isEmpty()) {
            return ResponseEntity.badRequest().body(null); // Return bad request if required fields are missing
        }

        // Save the sale and return the created sale DTO
        SaleDTO createdSale = saleService.saveSale(saleDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdSale);
    }

    // Get all sales
    @GetMapping
    public List<SaleDTO> getAllSales() {
        return saleService.getAllSales();
    }

    // Get sale by identifier (customer name, mobile number, etc.)
    @GetMapping("/{identifier}")
    public ResponseEntity<List<SaleDTO>> getSalesByIdentifier(@PathVariable String identifier) {
        // Handle logic for searching by identifier (e.g., customer name, phone number)
        List<SaleDTO> sales = saleService.findByIdentifier(identifier);
        return ResponseEntity.ok(sales);
    }

    // Delete a sale by ID
    @DeleteMapping("/{saleId}")
    public ResponseEntity<Void> deleteSale(@PathVariable Integer saleId) {
        saleService.deleteSale(saleId);
        return ResponseEntity.noContent().build();
    }
}
