package com.store.management.controller;

import com.store.management.model.Customer;
import com.store.management.service.CustomerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    @Autowired
    private CustomerService customerService;

    @GetMapping
    public List<Customer> getAllCustomers() {
        return customerService.getAllCustomers();
    }

    // ✅ Get customer by name or mobile number
    @GetMapping("/{identifier}")
    public ResponseEntity<Customer> getCustomerByIdentifier(@PathVariable String identifier) {
        Optional<Customer> optionalCustomer;

        if (identifier.matches("\\d+")) {
            // Looks like a mobile number
            optionalCustomer = customerService.getCustomerByMobileNumber(identifier);
        } else {
            // Otherwise treat as name
            optionalCustomer = customerService.getCustomerByName(identifier);
        }

        return optionalCustomer
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/create/{customerName}/{mobileNumber}/{address}")
public ResponseEntity<?> createCustomer(@PathVariable String customerName,
                                        @PathVariable String mobileNumber,
                                        @PathVariable String address) {
    boolean existence = customerService.customerExists(customerName, mobileNumber);

    if (existence) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body("Customer already exists with the same name and mobile number.");
    }

    Customer customer = new Customer();
    customer.setCustomerName(customerName);
    customer.setMobileNumber(mobileNumber);
    customer.setAddress(address);

    Customer createdCustomer = customerService.saveCustomer(customer);
    return ResponseEntity.ok(createdCustomer);
}


    // ✅ Delete only by mobile number or name (if you want)
    @DeleteMapping("/{identifier}")
    public ResponseEntity<Void> deleteCustomer(@PathVariable String identifier) {
        Optional<Customer> customerOpt = identifier.matches("\\d+")
                ? customerService.getCustomerByMobileNumber(identifier)
                : customerService.getCustomerByName(identifier);

        if (customerOpt.isPresent()) {
            customerService.deleteCustomer(customerOpt.get().getCustomerId());
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    // ✅ Update customer only by mobile number or name
    @PutMapping("/{identifier}")
    public ResponseEntity<Customer> updateCustomer(@PathVariable String identifier,
                                                   @RequestBody Customer customerDetails) {
        Optional<Customer> customerOpt = identifier.matches("\\d+")
                ? customerService.getCustomerByMobileNumber(identifier)
                : customerService.getCustomerByName(identifier);

        return customerOpt.map(customer -> {
            customer.setCustomerName(customerDetails.getCustomerName());
            customer.setMobileNumber(customerDetails.getMobileNumber());
            customer.setAddress(customerDetails.getAddress());
            Customer updatedCustomer = customerService.saveCustomer(customer);
            return ResponseEntity.ok(updatedCustomer);
        }).orElse(ResponseEntity.notFound().build());
    }
}
