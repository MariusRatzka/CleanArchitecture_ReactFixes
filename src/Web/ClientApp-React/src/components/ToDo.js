// src/components/ToDo.js
import React, { useEffect, useState } from 'react';
import {
  TodoItemsClient,
  TodoListsClient,
  CreateTodoItemCommand,
} from '../web-api-client.ts';

export function ToDo() {
  const [todoLists, setTodoLists] = useState([]);
  const [selectedListId, setSelectedListId] = useState(null);
  const [todoItems, setTodoItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 5;

  // Lade Liste beim Mount
  useEffect(() => {
    const client = new TodoListsClient();

    async function fetchLists() {
      const listsVm = await client.getTodoLists();
      setTodoLists(listsVm.lists);
      if (listsVm.lists.length > 0) {
        setSelectedListId(listsVm.lists[0].id);
      }
    }

    fetchLists();
  }, []);

  // Lade Items bei Listenauswahl oder Pagewechsel
  useEffect(() => {
    if (selectedListId !== null) {
      const client = new TodoItemsClient();

      async function fetchItems() {
        setLoading(true);
        try {
          const paginatedItems = await client.getTodoItemsWithPagination(
            selectedListId,
            pageNumber,
            pageSize
          );
          setTodoItems(paginatedItems);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      }

      fetchItems();
    }
  }, [selectedListId, pageNumber]);

  // Neues Item anlegen
  async function addTodoItem() {
    if (!newItemTitle.trim()) return;

    const client = new TodoItemsClient();
    const command = new CreateTodoItemCommand({
      listId: selectedListId,
      title: newItemTitle,
    });

    await client.createTodoItem(command);
    setNewItemTitle('');

    // Reload aktueller Seite
    const paginatedItems = await client.getTodoItemsWithPagination(
      selectedListId,
      pageNumber,
      pageSize
    );
    setTodoItems(paginatedItems);
  }

  return (
    <div>
      <h1>ToDo List</h1>

      <div className="mb-3">
        <label>Liste wählen: </label>
        <select
          value={selectedListId || ''}
          onChange={(e) => setSelectedListId(Number(e.target.value))}
        >
          {todoLists.map((list) => (
            <option key={list.id} value={list.id}>
              {list.title}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <input
          type="text"
          value={newItemTitle}
          onChange={(e) => setNewItemTitle(e.target.value)}
          placeholder="Neues ToDo..."
        />
        <button onClick={addTodoItem}>Hinzufügen</button>
      </div>

      {loading ? (
        <p>
          <em>Lade ToDos...</em>
        </p>
      ) : (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>Erledigt</th>
                <th>Titel</th>
              </tr>
            </thead>
            <tbody>
              {todoItems.items?.map((item) => (
                <tr key={item.id}>
                  <td>{item.done ? '✅' : '❌'}</td>
                  <td>{item.title}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination-controls">
            <button
              disabled={!todoItems.hasPreviousPage}
              onClick={() => setPageNumber((page) => Math.max(1, page - 1))}
            >
              Zurück
            </button>
            <span>
              Seite {todoItems.pageNumber} von {todoItems.totalPages}
            </span>
            <button
              disabled={!todoItems.hasNextPage}
              onClick={() => setPageNumber((page) => page + 1)}
            >
              Weiter
            </button>
          </div>
        </>
      )}
    </div>
  );
}
