import Button from '../Button';
import styles from '../../containers/SearchPage.module.css';

const SearchResults = ({ results, isAuthenticated, openEdit }) => {
    return (
        <div className={styles.resultsSection}>
            {results.length === 0 ? (
                <div className={styles.noResults}>No results</div>
            ) : (
                <ul className="list-group">
                    {results.map(item => (
                        <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                            <span>{item.name}</span>
                            <div>
                                {isAuthenticated() && (
                                    <Button variant="link" onClick={() => openEdit(item)}>Edit</Button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default SearchResults;
