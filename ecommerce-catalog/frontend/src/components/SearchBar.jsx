import { useState } from 'react';

export default function SearchBar({ initialValue, onSearch }) {
  const [value, setValue] = useState(initialValue || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(value.trim());
  };

  return (
    <form className="search-form" onSubmit={handleSubmit} role="search">
      <input
        className="search-input"
        type="text"
        placeholder="Search products, brands, tags..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Search products"
      />
      <button className="search-btn" type="submit">
        Search
      </button>
    </form>
  );
}
