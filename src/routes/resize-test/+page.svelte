<script lang="ts">
    let scale = $state(1);

    let view: HTMLDivElement;

    // Beispieldaten für die Tabelle
    const sampleRows = [
        { id: 1, name: 'Laura Müller', role: 'Product Manager', dept: 'Produkt', start: '2023-01-15', status: 'Active', progress: 82 },
        { id: 2, name: 'Maximilian Fischer', role: 'Frontend Developer', dept: 'Engineering', start: '2022-06-01', status: 'Active', progress: 64 },
        { id: 3, name: 'Sophie Weber', role: 'UX Designer', dept: 'Design', start: '2024-03-20', status: 'On leave', progress: 30 },
        { id: 4, name: 'Jonas Schmidt', role: 'Data Analyst', dept: 'Data', start: '2021-11-08', status: 'Active', progress: 91 },
        { id: 5, name: 'Fatima Köhler', role: 'QA Engineer', dept: 'Quality', start: '2020-09-30', status: 'Active', progress: 75 },
        { id: 6, name: 'Lukas Neumann', role: 'DevOps', dept: 'Infrastructure', start: '2019-04-12', status: 'Inactive', progress: 10 }
    ];
</script>

<div class="flex flex-col w-full h-full">
    <div class="flex flex-row">
        <input
                class="flex-1"
                bind:value={scale}
                type="range"
                min="0.1"
                max="5"
                step="0.01"
        >
        <span>{scale}</span>
    </div>

    <div class="flex flex-1 flex-col grow" bind:this={view} style="zoom: {scale};">
        <div class="mt-4 font-bold text-3xl">
            Hallo
        </div>

        <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" class="w-full h-full" title="Intro Video"></iframe>

        <!-- Beispieltabelle: realistisch aussehende Mitarbeiter-/Projektliste -->
        <div class="mt-6 overflow-auto border rounded-lg">
            <table class="min-w-full divide-y divide-gray-200 table-fixed">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rolle</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Abteilung</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Startdatum</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fortschritt</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-100">
                    {#each sampleRows as r}
                        <tr class="hover:bg-gray-50">
                            <td class="px-4 py-3 text-sm text-gray-700">{r.id}</td>
                            <td class="px-4 py-3 text-sm text-gray-900 font-medium">{r.name}</td>
                            <td class="px-4 py-3 text-sm text-gray-700">{r.role}</td>
                            <td class="px-4 py-3 text-sm text-gray-700">{r.dept}</td>
                            <td class="px-4 py-3 text-sm text-gray-700">{r.start}</td>
                            <td class="px-4 py-3 text-sm">
                                {#if r.status === 'Active'}
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">Active</span>
                                {:else if r.status === 'On leave'}
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">On leave</span>
                                {:else}
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">{r.status}</span>
                                {/if}
                            </td>
                            <td class="px-4 py-3 text-sm w-40">
                                <div class="w-full bg-gray-100 rounded h-2 overflow-hidden">
                                    <div class="bg-blue-500 h-2" style="width: {r.progress}%"></div>
                                </div>
                                <div class="mt-1 text-xs text-gray-500">{r.progress}%</div>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>

        <div style="width: {20}px; height: {20}px; background-color: red; zoom: {1/scale}">
            Ich bin immernoch 20x20px
        </div>
    </div>
</div>