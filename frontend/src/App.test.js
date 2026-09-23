import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login page when not authenticated', () => {
  render(<App />);
  const buttonElement = screen.getByText(/sign in to dashboard/i);
  expect(buttonElement).toBeInTheDocument();
});
