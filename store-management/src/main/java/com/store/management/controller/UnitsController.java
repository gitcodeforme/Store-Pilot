package com.store.management.controller;

import com.store.management.model.Units;
import com.store.management.service.UnitsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/units")
public class UnitsController {

    @Autowired
    private UnitsService unitsService;

    @GetMapping("/{identifier}")
    public ResponseEntity<Units> getUnitByIdentifier(@PathVariable String identifier) {
        Optional<Units> unit = Optional.empty();

        try {
            Integer unitId = Integer.parseInt(identifier);  // Try to parse as unitId
            unit = unitsService.getUnitById(unitId);
        } catch (NumberFormatException e) {
            unit = unitsService.getUnitByName(identifier);  // If unitId parsing fails, check by unitName
        }

        return unit.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<Units>> getAllUnits() {
    List<Units> units = unitsService.getAllUnits();
    return ResponseEntity.ok(units);
}


@PostMapping("/create")
    public ResponseEntity<Units> createUnit( @RequestBody Units unit) {
        Optional<Units> existingUnit = Optional.empty();
        if (unit.getUnitName() != null) {
            existingUnit = unitsService.getUnitByName(unit.getUnitName());
        }
        if (existingUnit.isPresent()) {
            return ResponseEntity.status(409).body(existingUnit.get());  // Conflict: unit already exists
        }

        unit.setUnitId(null);
        Units createdUnit = unitsService.saveUnit(unit);
        return ResponseEntity.status(201).body(createdUnit);  // Successfully created
    }



    @PutMapping("/{identifier}")
    public ResponseEntity<Units> updateUnit(@PathVariable String identifier, @RequestBody Units unitDetails) {
        Optional<Units> optionalUnit = Optional.empty();

        try {
            Integer unitId = Integer.parseInt(identifier);  // Try to parse as unitId
            optionalUnit = unitsService.getUnitById(unitId);
        } catch (NumberFormatException e) {
            optionalUnit = unitsService.getUnitByName(identifier);  // If unitId parsing fails, check by unitName
        }

        if (optionalUnit.isPresent()) {
            Units existingUnit = optionalUnit.get();
            existingUnit.setUnitName(unitDetails.getUnitName());
            Units updatedUnit = unitsService.saveUnit(existingUnit);
            return ResponseEntity.ok(updatedUnit);  // Successfully updated
        } else {
            return ResponseEntity.notFound().build();  // Not found
        }
    }


    @DeleteMapping("/{identifier}")
    public ResponseEntity<Void> deleteUnit(@PathVariable String identifier) {
        Optional<Units> unitToDelete = Optional.empty();

        try {
            Integer unitId = Integer.parseInt(identifier);  // Try to parse as unitId
            unitToDelete = unitsService.getUnitById(unitId);
        } catch (NumberFormatException e) {
            unitToDelete = unitsService.getUnitByName(identifier);  // If unitId parsing fails, check by unitName
        }

        if (unitToDelete.isPresent()) {
            unitsService.deleteUnit(unitToDelete.get().getUnitId());
            return ResponseEntity.noContent().build();  // Successfully deleted
        } else {
            return ResponseEntity.notFound().build();  // Not found
        }
    }
}

