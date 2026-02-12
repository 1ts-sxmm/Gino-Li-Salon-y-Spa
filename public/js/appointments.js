const serviceSelect = document.getElementById("service");
const employeeSelect = document.getElementById("employee");
const dateInput = document.getElementById("date");
const timeSelect = document.getElementById("time");
const form = document.getElementById("appointmentForm");
const durationOverrideInput = document.getElementById("duration_override");
const durationHint = document.getElementById("durationHint");
const priceFinalInput = document.getElementById("price_final");

const todayISO = new Date().toISOString().slice(0, 10);

const fetchJSON = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.msg || "Error");
  return data;
};

const loadServices = async () => {
  const services = await fetchJSON("/api/services");
  serviceSelect.innerHTML = `<option value="">Seleccione un servicio</option>`;
  services.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = `${s.name} (${s.duration} min)`;
    opt.dataset.duration = s.duration;
    serviceSelect.appendChild(opt);
  });
};

const loadEmployees = async () => {
  const employees = await fetchJSON("/api/employees");
  employeeSelect.innerHTML = `<option value="">Seleccione un trabajador</option>`;
  employees.forEach((e) => {
    const opt = document.createElement("option");
    opt.value = e.id;
    opt.textContent = e.name;
    employeeSelect.appendChild(opt);
  });
};

const resetTimes = (msg = "Seleccione una hora") => {
  timeSelect.innerHTML = `<option value="">${msg}</option>`;
};

const loadAvailableTimes = async () => {
  const service_id = serviceSelect.value;
  const employee_id = employeeSelect.value;
  const date = dateInput.value;

  if (!service_id || !employee_id || !date) {
    resetTimes("Seleccione servicio, trabajador y fecha");
    return;
  }

  resetTimes("Cargando...");

  try {
    const data = await fetchJSON(
      `/api/appointments/available?date=${encodeURIComponent(date)}&employee_id=${encodeURIComponent(employee_id)}&service_id=${encodeURIComponent(service_id)}`
    );

    const available = data.available || [];
    if (!available.length) {
      resetTimes("No hay horas disponibles");
      return;
    }

    timeSelect.innerHTML = `<option value="">Seleccione una hora</option>`;
    available.forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.textContent = t.slice(0, 5); // HH:MM
      timeSelect.appendChild(opt);
    });
  } catch (err) {
    resetTimes("Error cargando horas");
    alert(err.message);
  }
};

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    client_name: "Cliente",
    service_id: Number(serviceSelect.value),
    employee_id: Number(employeeSelect.value),
    appointment_date: dateInput.value,
    start_time: timeSelect.value,
    price_final: Number(priceFinalInput.value) // obligatorio
  };

  const d = durationOverrideInput.value.trim();
  if (d !== "") payload.duration_override = Number(d);

  try {
    await fetchJSON("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    alert("Cita creada ✅");
    await loadAvailableTimes();
  } catch (err) {
    alert(err.message);
  }
});

const init = async () => {
    dateInput.value = todayISO;
    resetTimes("Seleccione servicio, trabajador y fecha");

    await loadServices();
    await loadEmployees();

    serviceSelect.addEventListener("change", () => {
        const base = serviceSelect.selectedOptions[0]?.dataset.duration;

        durationHint.textContent = base
            ? `Duración base: ${base} min`
            : "";

        durationOverrideInput.value = ""; // limpia override viejo

        loadAvailableTimes();
    });

    employeeSelect.addEventListener("change", loadAvailableTimes);
    dateInput.addEventListener("change", loadAvailableTimes);

    durationOverrideInput.addEventListener("input", () => {

        const base = serviceSelect.selectedOptions[0]?.dataset.duration;

        if (!base) return;

        if (durationOverrideInput.value === "") {
            durationHint.textContent = `Duración base: ${base} min`;
        } else {
            durationHint.textContent = `Duración final: ${durationOverrideInput.value} min`;
        }

        loadAvailableTimes();
    });
};

init();