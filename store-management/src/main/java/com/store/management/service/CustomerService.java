package com.store.management.service;

import com.store.management.model.Customer;
import com.store.management.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigInteger;
import java.util.List;
import java.util.Optional;

@Service
public class CustomerService {

    @Autowired
    private CustomerRepository customerRepository;

    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    public Optional<Customer> getCustomerById(BigInteger id) {
        return customerRepository.findById(id);
    }

    public Optional<Customer> getCustomerByCode(String customerCode) {
        return customerRepository.findByCustomerCode(customerCode);
    }

    public Optional<Customer> getCustomerByMobileNumber(String mobileNumber) {
        return customerRepository.findByMobileNumber(mobileNumber);
    }
    
    public Optional<Customer> getCustomerByName(String name) {
        return customerRepository.findFirstByCustomerNameIgnoreCase(name);
    }
    
    public boolean customerExists(String customerName, String mobileNumber) {
    if (customerName == null || mobileNumber == null || customerName.isEmpty() || mobileNumber.isEmpty()) {
        return false; // skip existence check if data is invalid
    }
    return customerRepository.existsCustomer(customerName, mobileNumber);
}


    public Customer saveCustomer(Customer customer) {
        // Generate customer code if not provided
        if (customer.getCustomerCode() == null || customer.getCustomerCode().isEmpty()) {
            String lastCode = customerRepository.findLastCustomerCode(); // e.g., CUS9
            int nextNumber = 1;
    
            if (lastCode != null && lastCode.startsWith("CUS")) {
                try {
                    // Extract the number from the last code and increment it
                    nextNumber = Integer.parseInt(lastCode.substring(3)) + 1;
                } catch (NumberFormatException ignored) {}
            }
    
            // Generate the new customer code (CUS1, CUS2, ...)
            String newCustomerCode = "CUS" + nextNumber; // CUS1, CUS2, CUS3, ...
            customer.setCustomerCode(newCustomerCode);
        }
    
        return customerRepository.save(customer);
    }
    
    // public Customer saveCustomer(Customer customer) {
    //     return customerRepository.save(customer);
    // }

    public void deleteCustomer(BigInteger id) {
        customerRepository.deleteById(id);
    }
}
