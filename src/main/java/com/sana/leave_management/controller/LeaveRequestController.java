package com.sana.leave_management.controller;

import com.sana.leave_management.model.LeaveRequest;
import com.sana.leave_management.service.LeaveRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leaves")
@CrossOrigin(origins = "*")
public class LeaveRequestController {

    @Autowired
    private LeaveRequestService leaveRequestService;

    // Employee creates a leave request
    // POST /api/leaves/request
    @PostMapping("/request")
    public ResponseEntity<?> requestLeave(@RequestBody LeaveRequest lr) {
        // expects JSON with employeeId, managerId, subject, body, startDate, endDate
        LeaveRequest saved = leaveRequestService.createLeaveRequest(
                lr.getEmployeeId(),
                lr.getManagerId(),
                lr.getSubject(),
                lr.getBody(),
                lr.getStartDate(),
                lr.getEndDate()
        );
        return ResponseEntity.ok(saved);
    }

    // Manager: get pending leaves for manager
    // GET /api/leaves/manager/{managerId}/pending
    @GetMapping("/manager/{managerId}/pending")
    public ResponseEntity<List<LeaveRequest>> getPendingLeaves(@PathVariable int managerId) {
        List<LeaveRequest> list = leaveRequestService.getPendingLeavesForManager(managerId);
        return ResponseEntity.ok(list);
    }

    // Manager: update leave status (ACCEPTED/REJECTED)
    // PATCH /api/leaves/manager/update/{leaveId}?status=ACCEPTED
    @PatchMapping("/manager/update/{leaveId}")
    public ResponseEntity<?> updateLeave(@PathVariable String leaveId, @RequestParam String status) {
        try {
            LeaveRequest updated = leaveRequestService.updateLeaveStatus(leaveId, status);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error updating status: " + e.getMessage());
        }
    }

    // Employee: get 'status' view (items not yet acknowledged)
    // GET /api/leaves/employee/{employeeId}/status
    @GetMapping("/employee/{employeeId}/status")
    public ResponseEntity<List<LeaveRequest>> getEmployeeStatus(@PathVariable int employeeId) {
        return ResponseEntity.ok(leaveRequestService.getPendingForEmployee(employeeId));
    }
    @GetMapping("/manager/{managerId}/history")
public ResponseEntity<List<LeaveRequest>> managerHistory(@PathVariable int managerId) {
    List<LeaveRequest> list = leaveRequestService.getHistoryForManager(managerId);
    return ResponseEntity.ok(list);
}


    // Employee: acknowledge a leave (OK button)
    // POST /api/leaves/acknowledge/{leaveId}
    @PostMapping("/acknowledge/{leaveId}")
    public ResponseEntity<?> acknowledge(@PathVariable String leaveId) {
        leaveRequestService.acknowledgeLeave(leaveId);
        return ResponseEntity.ok(Map.of("message", "Acknowledged"));
    }



    // Employee: history, optional filters: ?status=ACCEPTED&year=2025
    // GET /api/leaves/employee/{employeeId}/history
    @GetMapping("/employee/{employeeId}/history")
    public ResponseEntity<List<LeaveRequest>> history(
            @PathVariable int employeeId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer year) {
        List<LeaveRequest> result = leaveRequestService.getHistoryForEmployee(employeeId, status, year);
        return ResponseEntity.ok(result);
    }
}
