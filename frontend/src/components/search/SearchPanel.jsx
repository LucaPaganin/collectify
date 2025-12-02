import Button from '../Button';
import styles from '../../containers/SearchPage.module.css';

const SearchPanel = ({
    query,
    setQuery,
    category,
    setCategory,
    categoriesList,
    debouncedSearch,
    search
}) => {
    return (
        <div className={styles.searchCard}>
            <div className={styles.searchTitle}>Search an item</div>
            <form
                className={styles.searchForm}
                onSubmit={e => {
                    e.preventDefault();
                    search(); // Explicit search on submit
                }}
            >
                <input
                    type="text"
                    className={`form-control ${styles.searchInput}`}
                    placeholder="Enter search string"
                    value={query}
                    onChange={e => {
                        setQuery(e.target.value);
                        // Call our debounced search function
                        debouncedSearch();
                    }}
                />
                <select
                    className={`form-select ${styles.searchSelect}`}
                    value={category}
                    onChange={e => {
                        setCategory(e.target.value);
                        // Call our debounced search function
                        debouncedSearch();
                    }}
                >
                    <option value="">Select Category</option>
                    {categoriesList.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
                <Button className={styles.searchBtn} onClick={() => search()}>
                    Search
                </Button>
            </form>
        </div>
    );
};

export default SearchPanel;
