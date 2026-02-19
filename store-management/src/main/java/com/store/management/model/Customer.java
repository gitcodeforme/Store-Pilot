package com.store.management.model;
import java.math.BigInteger;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "customer")
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "customer_id")
    private BigInteger customerId;

    @Column(name = "customer_code", unique = true)
    private String customerCode;

    @Column(name = "customer_name")   // ✅ ADD THIS
    private String customerName;

    @Column(name = "mobile_number")   // ✅ ADD THIS
    private String mobileNumber;

    @Lob
    @Column(name = "address")         // optional but recommended
    private String address;
}
