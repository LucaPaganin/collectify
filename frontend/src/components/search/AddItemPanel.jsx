import Button from '../Button';
import styles from '../../containers/SearchPage.module.css';

const AddItemPanel = ({
    newItemName,
    setNewItemName,
    newItemCategory,
    setNewItemCategory,
    categoriesList,
    openNew
}) => {
    return (
        <div className={styles.searchCard}>
            <div className={styles.searchTitle}>Add an item</div>
            <form className={styles.addForm} onSubmit={openNew}>
                <input
                    type="text"
                    className={`form-control ${styles.searchInput}`}
                    placeholder="Enter new item name"
                    value={newItemName}
                    onChange={e => setNewItemName(e.target.value)}
                    required
                />
                <select
                    className={`form-select ${styles.searchSelect}`}
                    value={newItemCategory}
                    onChange={e => setNewItemCategory(e.target.value)}
                    required
                >
                    <option value="">Select Category</option>
                    {categoriesList.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
                <Button
                    className={styles.addBtn}
                    type="submit"
                >
                    ADD
                </Button>
            </form>
        </div>
    );
};

export default AddItemPanel;
