import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './Card';

describe('Card', () => {
  it('renders children', () => {
    render(
      <Card>
        <p>Card content</p>
      </Card>
    );
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies default padding', () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.firstChild;
    expect(card).toHaveClass('p-4');
  });

  it('applies custom padding', () => {
    const { container } = render(<Card padding="lg">Content</Card>);
    const card = container.firstChild;
    expect(card).toHaveClass('p-6');
  });

  it('applies no padding when padding is none', () => {
    const { container } = render(<Card padding="none">Content</Card>);
    const card = container.firstChild;
    expect(card).not.toHaveClass('p-4');
  });

  it('applies hover styles when hover is true', () => {
    const { container } = render(<Card hover>Content</Card>);
    const card = container.firstChild;
    expect(card).toHaveClass('hover:shadow-lg', 'hover:-translate-y-1');
  });

  it('does not apply hover styles by default', () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.firstChild;
    expect(card).not.toHaveClass('hover:shadow-lg');
  });

  it('handles onClick event', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    render(<Card onClick={handleClick}>Content</Card>);
    
    const card = screen.getByRole('button');
    await user.click(card);
    
    expect(handleClick).toHaveBeenCalled();
  });

  it('is keyboard accessible when clickable', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    render(<Card onClick={handleClick}>Content</Card>);
    
    const card = screen.getByRole('button');
    card.focus();
    expect(card).toHaveFocus();
    
    await user.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalled();
    
    await user.keyboard(' ');
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it('renders as different HTML elements', () => {
    const { container, rerender } = render(<Card as="article">Content</Card>);
    expect(container.querySelector('article')).toBeInTheDocument();

    rerender(<Card as="section">Content</Card>);
    expect(container.querySelector('section')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-class">Content</Card>);
    const card = container.firstChild;
    expect(card).toHaveClass('custom-class');
  });

  it('has proper focus styles when clickable', () => {
    const { container } = render(<Card onClick={jest.fn()}>Content</Card>);
    const card = container.firstChild;
    expect(card).toHaveClass('focus:ring-2', 'focus:ring-primary-500');
  });
});

describe('CardHeader', () => {
  it('renders children', () => {
    render(
      <Card>
        <CardHeader>
          <h3>Header content</h3>
        </CardHeader>
      </Card>
    );
    expect(screen.getByText('Header content')).toBeInTheDocument();
  });

  it('applies border styling', () => {
    const { container } = render(
      <Card>
        <CardHeader>Header</CardHeader>
      </Card>
    );
    const header = container.querySelector('.border-b');
    expect(header).toBeInTheDocument();
  });
});

describe('CardTitle', () => {
  it('renders children', () => {
    render(
      <Card>
        <CardTitle>Card Title</CardTitle>
      </Card>
    );
    expect(screen.getByText('Card Title')).toBeInTheDocument();
  });

  it('renders as h3 by default', () => {
    const { container } = render(
      <Card>
        <CardTitle>Title</CardTitle>
      </Card>
    );
    expect(container.querySelector('h3')).toHaveTextContent('Title');
  });

  it('renders as custom heading level', () => {
    const { container } = render(
      <Card>
        <CardTitle as="h2">Title</CardTitle>
      </Card>
    );
    expect(container.querySelector('h2')).toHaveTextContent('Title');
  });

  it('applies title styling', () => {
    const { container } = render(
      <Card>
        <CardTitle>Title</CardTitle>
      </Card>
    );
    const title = container.querySelector('h3');
    expect(title).toHaveClass('text-lg', 'font-semibold');
  });
});

describe('CardContent', () => {
  it('renders children', () => {
    render(
      <Card>
        <CardContent>
          <p>Content text</p>
        </CardContent>
      </Card>
    );
    expect(screen.getByText('Content text')).toBeInTheDocument();
  });

  it('applies content styling', () => {
    const { container } = render(
      <Card>
        <CardContent>Content</CardContent>
      </Card>
    );
    const content = container.querySelector('.text-gray-700');
    expect(content).toBeInTheDocument();
  });
});

describe('CardFooter', () => {
  it('renders children', () => {
    render(
      <Card>
        <CardFooter>
          <button>Action</button>
        </CardFooter>
      </Card>
    );
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('applies border styling', () => {
    const { container } = render(
      <Card>
        <CardFooter>Footer</CardFooter>
      </Card>
    );
    const footer = container.querySelector('.border-t');
    expect(footer).toBeInTheDocument();
  });
});

describe('Card composition', () => {
  it('renders complete card with all sections', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Product Card</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Product description</p>
        </CardContent>
        <CardFooter>
          <button>Buy Now</button>
        </CardFooter>
      </Card>
    );

    expect(screen.getByText('Product Card')).toBeInTheDocument();
    expect(screen.getByText('Product description')).toBeInTheDocument();
    expect(screen.getByText('Buy Now')).toBeInTheDocument();
  });
});
