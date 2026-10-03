(() => {
  "use strict";

  const STORAGE_KEY = "agenda_contactos_v1";

  const $ = (selector) => document.querySelector(selector);

  const elements = {
    form: $("#contactForm"),
    formTitle: $("#formTitle"),
    contactId: $("#contactId"),
    nombre: $("#nombre"),
    apellido: $("#apellido"),
    documento: $("#documento"),
    email: $("#email"),
    telefono: $("#telefono"),
    expediente: $("#expediente"),
    saveBtn: $("#saveBtn"),
    cancelBtn: $("#cancelBtn"),
    clearBtn: $("#clearBtn"),
    searchInput: $("#searchInput"),
    statusFilter: $("#statusFilter"),
    contactsList: $("#contactsList"),
    emptyState: $("#emptyState"),
    resultInfo: $("#resultInfo"),
    totalCount: $("#totalCount"),
    pendingCount: $("#pendingCount"),
    doneCount: $("#doneCount"),
    exportBtn: $("#exportBtn"),
    importFile: $("#importFile"),
    toast: $("#toast")
  };

  let contacts = loadContacts();
  let toastTimer = null;

  function loadContacts() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("No se pudieron cargar los contactos:", error);
      return [];
    }
  }

  function saveContacts() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
    } catch (error) {
      console.error("No se pudieron guardar los contactos:", error);
      showToast("No se pudieron guardar los datos en el navegador.");
    }
  }

  function createId() {
    if (window.crypto && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalize(value) {
    return String(value ?? "")
      .toLocaleLowerCase("es")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function getFormData() {
    return {
      nombre: elements.nombre.value.trim(),
      apellido: elements.apellido.value.trim(),
      documento: elements.documento.value.trim(),
      email: elements.email.value.trim(),
      telefono: elements.telefono.value.trim(),
      expediente: elements.expediente.value.trim()
    };
  }

  function resetForm() {
    elements.form.reset();
    elements.contactId.value = "";
    elements.formTitle.textContent = "Nuevo contacto";
    elements.saveBtn.textContent = "Guardar contacto";
    elements.cancelBtn.hidden = true;
    elements.nombre.focus();
  }

  function editContact(id) {
    const contact = contacts.find((item) => item.id === id);
    if (!contact) return;

    elements.contactId.value = contact.id;
    elements.nombre.value = contact.nombre || "";
    elements.apellido.value = contact.apellido || "";
    elements.documento.value = contact.documento || "";
    elements.email.value = contact.email || "";
    elements.telefono.value = contact.telefono || "";
    elements.expediente.value = contact.expediente || "";

    elements.formTitle.textContent = "Editar contacto";
    elements.saveBtn.textContent = "Guardar cambios";
    elements.cancelBtn.hidden = false;

    window.scrollTo({ top: 0, behavior: "smooth" });
    elements.nombre.focus();
  }

  function deleteContact(id) {
    const contact = contacts.find((item) => item.id === id);
    if (!contact) return;

    const fullName = `${contact.nombre || ""} ${contact.apellido || ""}`.trim();
    const confirmed = window.confirm(
      `¿Quieres eliminar a "${fullName || "este contacto"}"?\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    contacts = contacts.filter((item) => item.id !== id);
    saveContacts();
    render();
    showToast("Contacto eliminado.");

    if (elements.contactId.value === id) {
      resetForm();
    }
  }

  function toggleDone(id) {
    const contact = contacts.find((item) => item.id === id);
    if (!contact) return;

    contact.done = !contact.done;
    contact.updatedAt = new Date().toISOString();
    saveContacts();
    render();

    showToast(contact.done ? "Contacto marcado como realizado." : "Contacto marcado como pendiente.");
  }

  function getFilteredContacts() {
    const search = normalize(elements.searchInput.value.trim());
    const status = elements.statusFilter.value;

    return contacts
      .filter((contact) => {
        if (status === "pending" && contact.done) return false;
        if (status === "done" && !contact.done) return false;

        if (!search) return true;

        const haystack = normalize([
          contact.nombre,
          contact.apellido,
          contact.documento,
          contact.email,
          contact.telefono,
          contact.expediente
        ].join(" "));

        return haystack.includes(search);
      })
      .sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;

        const nameA = normalize(`${a.apellido} ${a.nombre}`);
        const nameB = normalize(`${b.apellido} ${b.nombre}`);
        return nameA.localeCompare(nameB, "es");
      });
  }

  function render() {
    const filtered = getFilteredContacts();

    elements.totalCount.textContent = contacts.length;
    elements.pendingCount.textContent = contacts.filter((c) => !c.done).length;
    elements.doneCount.textContent = contacts.filter((c) => c.done).length;

    elements.resultInfo.textContent =
      filtered.length === 1
        ? "1 contacto mostrado"
        : `${filtered.length} contactos mostrados`;

    elements.emptyState.hidden = filtered.length !== 0;

    if (!filtered.length) {
      elements.contactsList.innerHTML = "";
      return;
    }

    elements.contactsList.innerHTML = filtered.map(contactCardHTML).join("");
  }

  function contactCardHTML(contact) {
    const fullName = `${contact.nombre || ""} ${contact.apellido || ""}`.trim() || "Sin nombre";
    const statusClass = contact.done ? "done" : "pending";
    const statusText = contact.done ? "Realizada" : "Pendiente";

    const details = [
      ["NIE/DNI/Pasaporte", contact.documento],
      ["Correo", contact.email],
      ["Teléfono", contact.telefono],
      ["Expediente", contact.expediente]
    ]
      .filter(([, value]) => value)
      .map(([label, value]) => `
        <div class="detail">
          <strong>${escapeHTML(label)}:</strong>
          ${escapeHTML(value)}
        </div>
      `)
      .join("");

    return `
      <article class="contact-card ${statusClass}">
        <div class="contact-main">
          <div class="contact-title-row">
            <h3 class="contact-title">${escapeHTML(fullName)}</h3>
            <span class="status-badge ${statusClass}">${statusText}</span>
          </div>

          <div class="contact-details">
            ${details || '<div class="detail">Sin información adicional.</div>'}
          </div>
        </div>

        <div class="card-actions">
          <button
            class="btn ${contact.done ? "btn-secondary" : "btn-success"}"
            type="button"
            data-action="toggle"
            data-id="${escapeHTML(contact.id)}"
          >
            ${contact.done ? "↩ Pendiente" : "✓ Realizada"}
          </button>

          <button
            class="btn btn-secondary"
            type="button"
            data-action="edit"
            data-id="${escapeHTML(contact.id)}"
          >
            Editar
          </button>

          <button
            class="btn btn-danger"
            type="button"
            data-action="delete"
            data-id="${escapeHTML(contact.id)}"
          >
            Eliminar
          </button>
        </div>
      </article>
    `;
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("show");

    toastTimer = setTimeout(() => {
      elements.toast.classList.remove("show");
    }, 2500);
  }

  function exportContacts() {
    const data = {
      app: "Agenda de contactos",
      version: 1,
      exportedAt: new Date().toISOString(),
      contacts
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `agenda-contactos-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    showToast("Contactos exportados correctamente.");
  }

  function importContacts(file) {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const imported = Array.isArray(parsed) ? parsed : parsed.contacts;

        if (!Array.isArray(imported)) {
          throw new Error("Formato no válido");
        }

        const cleaned = imported
          .filter((item) => item && typeof item === "object")
          .map((item) => ({
            id: String(item.id || createId()),
            nombre: String(item.nombre || "").trim(),
            apellido: String(item.apellido || "").trim(),
            documento: String(item.documento || "").trim(),
            email: String(item.email || "").trim(),
            telefono: String(item.telefono || "").trim(),
            expediente: String(item.expediente || "").trim(),
            done: Boolean(item.done),
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: item.updatedAt || new Date().toISOString()
          }));

        const replace = window.confirm(
          `El archivo contiene ${cleaned.length} contactos.\n\n` +
          "Aceptar = reemplazar los contactos actuales.\n" +
          "Cancelar = añadirlos a los contactos actuales."
        );

        if (replace) {
          contacts = cleaned;
        } else {
          const existingIds = new Set(contacts.map((contact) => contact.id));
          cleaned.forEach((contact) => {
            if (existingIds.has(contact.id)) {
              contact.id = createId();
            }
            contacts.push(contact);
          });
        }

        saveContacts();
        render();
        showToast("Importación completada.");
      } catch (error) {
        console.error(error);
        window.alert("No se pudo importar el archivo. Comprueba que sea un JSON de esta agenda.");
      } finally {
        elements.importFile.value = "";
      }
    };

    reader.readAsText(file, "utf-8");
  }

  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = getFormData();

    if (!data.nombre || !data.apellido) {
      window.alert("El nombre y el apellido son obligatorios.");
      return;
    }

    const editingId = elements.contactId.value;

    if (editingId) {
      const index = contacts.findIndex((contact) => contact.id === editingId);

      if (index !== -1) {
        contacts[index] = {
          ...contacts[index],
          ...data,
          updatedAt: new Date().toISOString()
        };
        showToast("Cambios guardados.");
      }
    } else {
      contacts.push({
        id: createId(),
        ...data,
        done: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      showToast("Contacto añadido.");
    }

    saveContacts();
    render();
    resetForm();
  });

  elements.cancelBtn.addEventListener("click", resetForm);

  elements.clearBtn.addEventListener("click", () => {
    setTimeout(() => {
      elements.contactId.value = "";
      elements.formTitle.textContent = "Nuevo contacto";
      elements.saveBtn.textContent = "Guardar contacto";
      elements.cancelBtn.hidden = true;
    }, 0);
  });

  elements.searchInput.addEventListener("input", render);
  elements.statusFilter.addEventListener("change", render);
  elements.exportBtn.addEventListener("click", exportContacts);
  elements.importFile.addEventListener("change", (event) => {
    importContacts(event.target.files[0]);
  });

  elements.contactsList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const { action, id } = button.dataset;

    if (action === "edit") editContact(id);
    if (action === "delete") deleteContact(id);
    if (action === "toggle") toggleDone(id);
  });

  render();
})();
