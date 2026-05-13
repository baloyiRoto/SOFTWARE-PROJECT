export const mockUsers = [
  { userID: 1, username: 'kevin_jones', email: 'kevin@student.ac.za', password: 'kev#2026', role: 'student' },
  { userID: 2, username: 'jonathan_smith', email: 'jonathan@student.ac.za', password: 'jSmith!89', role: 'student' },
  { userID: 3, username: 'amina_kristen', email: 'amina@student.ac.za', password: 'Am!na$321', role: 'student' },
  { userID: 4, username: 'lelo_mathosa', email: 'lelo@student.ac.za', password: 'lelo@456', role: 'student' },
  { userID: 5, username: 'thabo_nkosi', email: 'thabo@student.ac.za', password: 'Tnkosi#77', role: 'student' },
  { userID: 6, username: 'admin_user', email: 'admin@spendsmart.com', password: 'Adm!n@99', role: 'admin' }
];

export const mockCategories = [
  { categoryID: 1, categoryName: 'Food', description: 'Groceries, takeaways and meals' },
  { categoryID: 2, categoryName: 'Transport', description: 'Taxi, bus and fuel costs' },
  { categoryID: 3, categoryName: 'Rent', description: 'Monthly accommodation payments' },
  { categoryID: 4, categoryName: 'Stationery', description: 'Books, pens and study materials' },
  { categoryID: 5, categoryName: 'Entertainment', description: 'Streaming, outings and hobbies' },
  { categoryID: 6, categoryName: 'Data', description: 'Mobile data and internet' }
];

export const mockExpenses = [
  { expenseID: 1, userID: 1, categoryID: 1, amount: 250.00, description: 'Groceries at Pick n Pay', expenseDate: '2026-04-01' },
  { expenseID: 2, userID: 1, categoryID: 2, amount: 80.00, description: 'Taxi to campus', expenseDate: '2026-04-02' },
  { expenseID: 3, userID: 2, categoryID: 3, amount: 3500.00, description: 'Monthly rent payment', expenseDate: '2026-04-01' },
  { expenseID: 4, userID: 2, categoryID: 4, amount: 450.00, description: 'Textbooks for semester', expenseDate: '2026-04-03' },
  { expenseID: 5, userID: 3, categoryID: 5, amount: 99.00, description: 'Netflix subscription', expenseDate: '2026-04-04' },
  { expenseID: 6, userID: 3, categoryID: 6, amount: 150.00, description: 'Monthly data bundle', expenseDate: '2026-04-01' },
  { expenseID: 7, userID: 4, categoryID: 1, amount: 320.00, description: 'Weekly groceries', expenseDate: '2026-04-05' },
  { expenseID: 8, userID: 4, categoryID: 2, amount: 60.00, description: 'Bus fare for the week', expenseDate: '2026-04-05' },
  { expenseID: 9, userID: 5, categoryID: 4, amount: 200.00, description: 'Stationery for assignments', expenseDate: '2026-04-06' },
  { expenseID: 10, userID: 5, categoryID: 1, amount: 180.00, description: 'Takeaways', expenseDate: '2026-04-07' }
];

export const mockBudgets = [
  { budgetID: 1, userID: 1, categoryID: 1, amount: 1000.00, month: 4, year: 2026 },
  { budgetID: 2, userID: 1, categoryID: 2, amount: 400.00, month: 4, year: 2026 },
  { budgetID: 3, userID: 2, categoryID: 3, amount: 4000.00, month: 4, year: 2026 },
  { budgetID: 4, userID: 2, categoryID: 4, amount: 500.00, month: 4, year: 2026 },
  { budgetID: 5, userID: 3, categoryID: 5, amount: 200.00, month: 4, year: 2026 },
  { budgetID: 6, userID: 3, categoryID: 6, amount: 200.00, month: 4, year: 2026 },
  { budgetID: 7, userID: 4, categoryID: 1, amount: 1200.00, month: 4, year: 2026 },
  { budgetID: 8, userID: 5, categoryID: 2, amount: 300.00, month: 4, year: 2026 }
];