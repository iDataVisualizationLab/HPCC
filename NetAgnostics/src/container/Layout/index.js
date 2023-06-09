import AppBar from "../../component/AppBar";

export default function({
                            children,
                            pageTitle,
                            onBackClick,
                            isLoading,
                            appBarContent = null,
                            contentStyle,
                            tabs = null,
                        }){
    return <div
        style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            overflow: 'hidden',
        }}
    >
        <AppBar title={'Net Agnostics'}/>
        {children}
    </div>
}