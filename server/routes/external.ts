
import express from 'express';
import { executeQuery } from '../config/database';

const router = express.Router();

// Get staff balances - for external systems
router.get('/balances/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const year = req.query.year || new Date().getFullYear();
    
    const balance = await executeQuery(
      `SELECT EmployeeName, EmployeeEmail, Department, Year, 
              Current_leave_balance as annual_balance,
              (Sick - SickUsed) as sick_balance,
              (Family - FamilyUsed) as family_balance,
              (Study - StudyUsed) as study_balance,
              (Wellness - WellnessUsed) as wellness_balance,
              Contract_termination_date
       FROM leave_balances 
       WHERE EmployeeEmail = ? AND Year = ?`,
      [email, year]
    );

    if (balance.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Employee balance not found' 
      });
    }

    res.json({ 
      success: true, 
      employee: balance[0] 
    });
  } catch (error) {
    console.error('External balance API error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve balance' 
    });
  }
});

// Get all staff balances - for external systems
router.get('/balances', async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const department = req.query.department;
    
    let query = `SELECT EmployeeName, EmployeeEmail, Department, Year, 
                        Current_leave_balance as annual_balance,
                        (Sick - SickUsed) as sick_balance,
                        (Family - FamilyUsed) as family_balance,
                        (Study - StudyUsed) as study_balance,
                        (Wellness - WellnessUsed) as wellness_balance,
                        Contract_termination_date
                 FROM leave_balances 
                 WHERE Year = ?`;
    
    let params = [year];
    
    if (department) {
      query += ' AND Department = ?';
      params.push(department);
    }
    
    query += ' ORDER BY EmployeeName';
    
    const balances = await executeQuery(query, params);

    res.json({ 
      success: true, 
      employees: balances,
      total_count: balances.length 
    });
  } catch (error) {
    console.error('External balances API error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve balances' 
    });
  }
});

// Get leave applications - for external systems
router.get('/applications/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const year = req.query.year || new Date().getFullYear();
    const status = req.query.status;
    
    let query = `SELECT LeaveID, Title, StartDate, EndDate, LeaveType, 
                        Status, workingDays, Created, Modified
                 FROM leave_taken 
                 WHERE Requester = ? AND YEAR(StartDate) = ?`;
    
    let params = [email, year];
    
    if (status) {
      query += ' AND Status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY Created DESC';
    
    const applications = await executeQuery(query, params);

    res.json({ 
      success: true, 
      applications: applications,
      total_count: applications.length 
    });
  } catch (error) {
    console.error('External applications API error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve applications' 
    });
  }
});

// Get all leave applications - for external systems
router.get('/applications', async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const status = req.query.status;
    const department = req.query.department;
    
    let query = `SELECT lt.LeaveID, lt.Title, lt.StartDate, lt.EndDate, 
                        lt.LeaveType, lt.Status, lt.workingDays, lt.Created, 
                        lt.Modified, lt.Requester, lb.EmployeeName, lb.Department
                 FROM leave_taken lt
                 LEFT JOIN leave_balances lb ON lt.Requester = lb.EmployeeEmail 
                    AND lb.Year = ?
                 WHERE YEAR(lt.StartDate) = ?`;
    
    let params = [year, year];
    
    if (status) {
      query += ' AND lt.Status = ?';
      params.push(status);
    }
    
    if (department) {
      query += ' AND lb.Department = ?';
      params.push(department);
    }
    
    query += ' ORDER BY lt.Created DESC';
    
    const applications = await executeQuery(query, params);

    res.json({ 
      success: true, 
      applications: applications,
      total_count: applications.length 
    });
  } catch (error) {
    console.error('External applications API error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve applications' 
    });
  }
});

export default router;
