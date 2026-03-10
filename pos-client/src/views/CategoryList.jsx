import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Table,
    Button,
    Card,
    Row,
    Col,
    Form,
    InputGroup,
    Dropdown,
    ButtonGroup,
    Alert
} from 'react-bootstrap';
import { useTable, usePagination, useGlobalFilter, useRowSelect } from 'react-table';
import { api, msg } from '../services';
import { Loader, SafeFontAwesomeIcon, FormModal } from '../components';
import {
    faPlus,
    faEdit,
    faTrash,
    faCopy,
    faDownload,
    faSearch,
    faImage,
    faTimes
} from '@fortawesome/free-solid-svg-icons';
import authStore from '../stores/authStore';

const CategoryList = () => {
    const can = (p) => authStore.can(p);
    const [categories, setCategories] = useState([]);
    const [parentCategories, setParentCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showFormModal, setShowFormModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        parent_id: '',
        image: null,
        icon: null,
        is_sync_disable: false,
        featured: false,
        page_title: '',
        short_description: ''
    });

    const [importFile, setImportFile] = useState(null);

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            // Mirror the server-side data source used in the original Blade view (category/category-data)
            const res = await api.post('category/category-data');
            if (res.status === 200) {
                const data = Array.isArray(res.data) ? res.data : res.data.data || [];
                setCategories(data);
            }
        } catch (error) {
            msg.error("Failed to fetch categories");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchParentCategories = useCallback(async () => {
        try {
            const res = await api.get('categories/parent');
            if (res.status === 200) {
                setParentCategories(res.data);
            }
        } catch (error) {
            console.error("Failed to fetch parent categories", error);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
        fetchParentCategories();
    }, [fetchCategories, fetchParentCategories]);

    const handleInputChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        if (type === 'file') {
            setFormData(prev => ({ ...prev, [name]: files[0] }));
        } else if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleAddNew = () => {
        setFormData({
            name: '',
            parent_id: '',
            image: null,
            icon: null,
            is_sync_disable: false,
            featured: false,
            page_title: '',
            short_description: ''
        });
        setEditMode(false);
        setCurrentId(null);
        setShowFormModal(true);
    };

    const handleEdit = async (id) => {
        setLoading(true);
        try {
            const res = await api.get(`category/${id}/edit`);
            if (res.status === 200) {
                const data = res.data;
                setFormData({
                    name: data.name,
                    parent_id: data.parent_id || '',
                    image: null,
                    icon: null,
                    is_sync_disable: data.is_sync_disable === 1,
                    featured: data.featured === 1,
                    page_title: data.page_title || '',
                    short_description: data.short_description || ''
                });
                setCurrentId(data.id);
                setEditMode(true);
                setShowFormModal(true);
            }
        } catch (error) {
            msg.error("Failed to fetch category details");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("If you delete category all products under this category will also be deleted. Are you sure want to delete?")) return;

        try {
            const res = await api.delete(`category/${id}`);
            if (res.status === 200) {
                msg.success(res.data.message || "Category deleted successfully");
                fetchCategories();
            }
        } catch (error) {
            msg.error("Failed to delete category");
        }
    };

    const handleBulkDelete = async (selectedIds) => {
        if (selectedIds.length === 0) {
            msg.error("No category is selected!");
            return;
        }

        if (!window.confirm("If you delete category all products under this category will also be deleted. Are you sure want to delete?")) return;

        try {
            const res = await api.post('category/deletebyselection', { categoryIdArray: selectedIds });
            if (res.status === 200) {
                msg.success("Selected categories deleted successfully");
                fetchCategories();
            }
        } catch (error) {
            msg.error("Failed to delete selected categories");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        data.append('name', formData.name);
        data.append('parent_id', formData.parent_id || '');
        if (formData.image) data.append('image', formData.image);
        if (formData.icon) data.append('icon', formData.icon);
        data.append('is_sync_disable', formData.is_sync_disable ? 1 : 0);
        data.append('featured', formData.featured ? 1 : 0);
        data.append('page_title', formData.page_title || '');
        data.append('short_description', formData.short_description || '');

        if (editMode) {
            data.append('_method', 'PUT');
            data.append('category_id', currentId);
        }

        try {
            const url = editMode ? `category/${currentId}` : 'category';
            const res = await api.post(url, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.status === 200 || res.status === 201) {
                msg.success(editMode ? "Category updated successfully" : "Category added successfully");
                setShowFormModal(false);
                fetchCategories();
                fetchParentCategories();
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || (editMode ? "Failed to update category" : "Failed to add category");
            msg.error(errorMsg);
        }
    };

    const handleImportSubmit = async (e) => {
        e.preventDefault();
        if (!importFile) {
            msg.error("Please select a CSV file");
            return;
        }

        const data = new FormData();
        data.append('file', importFile);

        try {
            const res = await api.post('category/import', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.status === 200) {
                msg.success("Categories imported successfully");
                setShowImportModal(false);
                fetchCategories();
                fetchParentCategories();
            }
        } catch (error) {
            msg.error("Failed to import categories");
        }
    };

    const columns = useMemo(() => [
        {
            id: 'selection',
            Header: ({ getToggleAllRowsSelectedProps }) => (
                <div className="checkbox">
                    <Form.Check {...getToggleAllRowsSelectedProps()} />
                </div>
            ),
            Cell: ({ row }) => (
                <div className="checkbox">
                    <Form.Check {...row.getToggleRowSelectedProps()} />
                </div>
            ),
            width: 50
        },
        {
            Header: 'Category',
            accessor: 'name',
            Cell: ({ value }) => (
                <span className="font-weight-bold ml-2">{value}</span>
            )
        },
        {
            Header: 'Parent Category',
            // Match the server field name used in the Blade DataTable config
            accessor: 'parent_id',
        },
        {
            Header: 'Number of Product',
            accessor: 'number_of_product',
            Cell: ({ value }) => value || 0
        },
        {
            Header: 'Stock Quantity',
            accessor: 'stock_qty',
            Cell: ({ value }) => value || 0
        },
        {
            Header: 'Stock Worth',
            accessor: 'stock_worth',
            Cell: ({ value }) => value || '0.00 / 0.00'
        },
        {
            Header: 'Action',
            id: 'action',
            className: 'not-exported',
            Cell: ({ row }) => (
                <Dropdown as={ButtonGroup} size="sm">
                    <Button variant="outline-primary" onClick={() => handleEdit(row.original.id)}>
                        <SafeFontAwesomeIcon icon={faEdit} />
                    </Button>
                    <Dropdown.Toggle split variant="outline-primary" id={`dropdown-split-basic-${row.original.id}`} />
                    <Dropdown.Menu>
                        <Dropdown.Item onClick={() => handleEdit(row.original.id)}>
                            <SafeFontAwesomeIcon icon={faEdit} className="mr-2 text-info" /> Edit
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => handleDelete(row.original.id)} className="text-danger">
                            <SafeFontAwesomeIcon icon={faTrash} className="mr-2" /> Delete
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            )
        }
    ], []);

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        page,
        prepareRow,
        state,
        setGlobalFilter,
        nextPage,
        previousPage,
        canNextPage,
        canPreviousPage,
        pageOptions,
        selectedFlatRows,
    } = useTable(
        {
            columns,
            data: categories,
            initialState: { pageSize: 10 },
        },
        useGlobalFilter,
        usePagination,
        useRowSelect
    );

    const { globalFilter, pageIndex } = state;

    return (
        <section className="container-fluid py-4">
            {loading && <Loader />}

            {successMessage && (
                <Alert variant="success" onClose={() => setSuccessMessage(null)} dismissible>
                    {successMessage}
                </Alert>
            )}
            {errorMessage && (
                <Alert variant="danger" onClose={() => setErrorMessage(null)} dismissible>
                    {errorMessage}
                </Alert>
            )}

            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="font-weight-bold text-dark mb-0">Category</h3>
                </div>
                <div className="d-flex gap-2">
                    
                        <Button variant="info" className="shadow-sm d-flex align-items-center" onClick={handleAddNew}>
                            <SafeFontAwesomeIcon icon={faPlus} className="mr-2" /> Add Category
                        </Button>
                    
                    
                        <Button variant="primary" className="shadow-sm d-flex align-items-center ms-2" onClick={() => setShowImportModal(true)}>
                            <SafeFontAwesomeIcon icon={faCopy} className="mr-2" /> Import Category
                        </Button>
                    
                </div>
            </div>

            <Card className="shadow-sm border-0 mb-4">
                <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <InputGroup className="w-25 shadow-sm">
                            <InputGroup.Text className="bg-white border-end-0">
                                <SafeFontAwesomeIcon icon={faSearch} className="text-muted" />
                            </InputGroup.Text>
                            <Form.Control
                                className="border-start-0 shadow-none"
                                placeholder="Search..."
                                value={globalFilter || ''}
                                onChange={e => setGlobalFilter(e.target.value)}
                            />
                        </InputGroup>

                        {selectedFlatRows.length > 0 && (
                            <Button variant="danger" size="sm" onClick={() => handleBulkDelete(selectedFlatRows.map(d => d.original.id))}>
                                <SafeFontAwesomeIcon icon={faTrash} className="mr-2" /> Delete Selected ({selectedFlatRows.length})
                            </Button>
                        )}
                    </div>

                    <div className="table-responsive">
                        <Table {...getTableProps()} hover className="align-middle border-0" id="category-table">
                            <thead className="bg-light text-muted text-uppercase small">
                                {headerGroups.map(headerGroup => (
                                    <tr {...headerGroup.getHeaderGroupProps()}>
                                        {headerGroup.headers.map(column => (
                                            <th {...column.getHeaderProps()} className="px-4 py-3 border-0">
                                                {column.render('Header')}
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <tbody {...getTableBodyProps()} className="border-0 text-dark">
                                {page.length > 0 ? (
                                    page.map(row => {
                                        prepareRow(row);
                                        return (
                                            <tr {...row.getRowProps()} className="border-bottom-light">
                                                {row.cells.map(cell => (
                                                    <td {...cell.getCellProps()} className="px-4 py-3 border-0">
                                                        {cell.render('Cell')}
                                                    </td>
                                                ))}
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={columns.length} className="text-center py-5 text-muted font-italic">
                                            No data found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mt-3 px-2">
                        <div className="text-muted small">
                            Showing {page.length} of {categories.length} entries
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => previousPage()}
                                disabled={!canPreviousPage}
                                className="border-0 shadow-none px-3"
                            >
                                Previous
                            </Button>
                            <span className="small text-muted font-weight-bold mx-2">
                                Page {pageIndex + 1} of {pageOptions.length || 1}
                            </span>
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => nextPage()}
                                disabled={!canNextPage}
                                className="border-0 shadow-none px-3"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* Edit Modal */}
            <FormModal
                moduleName={editMode ? 'Update Category' : 'Add Category'}
                modalState={showFormModal}
                toggleFormModal={() => setShowFormModal(false)}
                width="800px"
            >
                <Form onSubmit={handleSubmit} className="p-4" id="editCategoryForm">
                    <p className="italic mb-4 text-muted small"><small>The field labels marked with * are required input fields.</small></p>
                    <Row>
                        <Col md={6} className="mb-3 form-group">
                            <Form.Label className="font-weight-bold small">Name *</Form.Label>
                            <Form.Control
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter category name"
                                className="shadow-none"
                            />
                        </Col>

                        <Col md={6} className="mb-3 form-group">
                            <Form.Label className="font-weight-bold small">Image</Form.Label>
                            <Form.Control
                                type="file"
                                name="image"
                                onChange={handleInputChange}
                                accept="image/*"
                                className="shadow-none"
                            />
                        </Col>

                        <Col md={6} className="mb-3 form-group">
                            <Form.Label className="font-weight-bold small">Parent Category</Form.Label>
                            <Form.Select
                                name="parent_id"
                                value={formData.parent_id}
                                onChange={handleInputChange}
                                className="shadow-none"
                            >
                                <option value="">No Parent</option>
                                {parentCategories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </Form.Select>
                        </Col>

                        <Col md={6} className="mb-3 d-flex align-items-center mt-3">
                            <h5 className="mb-0 small d-flex align-items-center">
                                <Form.Check
                                    type="checkbox"
                                    id="is_sync_disable"
                                    name="is_sync_disable"
                                    label=" Disable Woocommerce Sync"
                                    checked={formData.is_sync_disable}
                                    onChange={handleInputChange}
                                    className="font-weight-bold mr-2"
                                />
                            </h5>
                        </Col>

                        {/* For Website - restaurant / ecommerce blocks */}
                        <Col md={12} className="mt-3">
                            <h6 className="font-weight-bold small mb-2">For Website</h6>
                            <hr />
                        </Col>

                        {/* Restaurant style listing on website */}
                        <Col md={12} className="mb-3 form-group">
                            <Form.Check
                                type="checkbox"
                                id="featured_website"
                                name="featured"
                                label=" List on website"
                                checked={formData.featured}
                                onChange={handleInputChange}
                                className="small font-weight-bold"
                            />
                        </Col>

                        {/* Ecommerce specific icon + dropdown listing */}
                        <Col md={6} className="mb-3 form-group">
                            <Form.Label className="font-weight-bold small">Icon</Form.Label>
                            <Form.Control
                                type="file"
                                name="icon"
                                onChange={handleInputChange}
                                accept="image/*"
                                className="shadow-none"
                            />
                        </Col>

                        <Col md={6} className="mb-3 d-flex align-items-center mt-3">
                            <Form.Check
                                type="checkbox"
                                id="featured_dropdown"
                                name="featured"
                                label=" List on category dropdown"
                                checked={formData.featured}
                                onChange={handleInputChange}
                                className="small font-weight-bold"
                            />
                        </Col>

                        {/* For SEO block */}
                        <Col md={12} className="mt-3">
                            <h6 className="font-weight-bold small mb-2">For SEO</h6>
                            <hr />
                        </Col>

                        <Col md={12} className="mb-3 form-group">
                            <Form.Label className="font-weight-bold small">Meta Title</Form.Label>
                            <Form.Control
                                name="page_title"
                                value={formData.page_title}
                                onChange={handleInputChange}
                                placeholder="Meta Title"
                                className="shadow-none"
                            />
                        </Col>

                        <Col md={12} className="mb-3 form-group">
                            <Form.Label className="font-weight-bold small">Meta Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                name="short_description"
                                value={formData.short_description}
                                onChange={handleInputChange}
                                placeholder="Meta Description"
                                className="shadow-none"
                            />
                        </Col>
                    </Row>

                    <div className="mt-4 d-flex justify-content-end gap-2">
                        <Button variant="outline-secondary" onClick={() => setShowFormModal(false)} className="px-4 border-0">Cancel</Button>
                        <Button variant="primary" type="submit" className="px-5 shadow-sm rounded-pill btn-md">Submit</Button>
                    </div>
                </Form>
            </FormModal>

            {/* Import Modal */}
            <FormModal
                moduleName="Import Category"
                modalState={showImportModal}
                toggleFormModal={() => setShowImportModal(false)}
                width="500px"
            >
                <Form onSubmit={handleImportSubmit} className="p-4">
                    <p className="italic mb-4 text-muted small"><small>The field labels marked with * are required input fields.</small></p>
                    <p className="small mb-4 text-dark">The correct column order is <strong>(name*, parent_category)</strong> and you must follow this.</p>

                    <Row>
                        <Col md={6} className="mb-4">
                            <Form.Group>
                                <Form.Label className="font-weight-bold small">Upload CSV File *</Form.Label>
                                <Form.Control
                                    type="file"
                                    accept=".csv"
                                    onChange={(e) => setImportFile(e.target.files[0])}
                                    required
                                    className="shadow-none"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6} className="mb-4">
                            <Form.Label className="font-weight-bold small">Sample File</Form.Label>
                            <Button variant="info" className="w-100 d-flex align-items-center justify-content-center" as="a" href="sample_file/sample_category.csv" download>
                                <SafeFontAwesomeIcon icon={faDownload} className="mr-2" /> Download
                            </Button>
                        </Col>
                    </Row>

                    <div className="d-flex justify-content-end gap-2 mt-2">
                        <Button variant="outline-secondary" onClick={() => setShowImportModal(false)} className="border-0">Cancel</Button>
                        <Button variant="primary" type="submit" className="px-4 shadow-sm rounded-pill">Submit</Button>
                    </div>
                </Form>
            </FormModal>

            <style>{`
                .italic { font-style: italic; }
                .border-bottom-light { border-bottom: 1px solid #f1f3f5; }
                .gap-2 { gap: 0.5rem; }
                .ms-2 { margin-left: 0.5rem; }
                .ml-2 { margin-left: 0.5rem; }
                .mr-2 { margin-right: 0.5rem; }
                .dropdown-toggle::after { display: none; }
                .letter-spacing-1 { letter-spacing: 0.05rem; }
                .uppercase { text-transform: uppercase; }
                .btn-md { padding: 0.5rem 1.5rem; }
                #category-table thead th { vertical-align: middle; border-bottom: 1px solid #dee2e6; letter-spacing: 0.02em; }
                .checkbox input { cursor: pointer; }
            `}</style>
        </section>
    );
};

export default CategoryList;
